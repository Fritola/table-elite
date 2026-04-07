import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Nova API Gateway descoberta
const WTT_API_URL = 'https://wttcmsapigateway-new.azure-api.net/internalttu/RankingsCurrentWeek/CurrentWeek/GetRankingIndividuals';

const HEADERS = {
  'secapimkey': 'S_WTT_882jjh7basdj91834783mds8j2jsd81',
  'apikey': '2bf8b222-532c-4c60-8ebe-eb6fdfebe84a',
  'referer': 'https://www.worldtabletennis.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

async function fetchRankings(subEventCode) {
  const url = `${WTT_API_URL}?CategoryCode=SEN&SubEventCode=${subEventCode}&StartRank=1&EndRank=500&q=1`;
  const response = await fetch(url, { headers: HEADERS });
  
  if (!response.ok) {
    throw new Error(`Erro HTTP ao buscar ${subEventCode}: ${response.status}`);
  }
  
  const data = await response.json();
  return data || [];
}

async function syncRankings() {
  console.log('🚀 Iniciando sincronização oficial com WTT API Gateway...');

  try {
    // Carregar o mapa de fotos baixado anteriormente
    const photoMapPath = path.join(__dirname, 'wtt_photo_map.json');
    let photoMap = [];
    try {
      let rawData = fs.readFileSync(photoMapPath, 'utf8');
      // Remover BOM se existir (comum em arquivos baixados via curl de alguns servidores)
      rawData = rawData.replace(/^\uFEFF/, '');
      photoMap = JSON.parse(rawData);
      console.log(`📸 Mapa de fotos carregado: ${photoMap.length} registros.`);
    } catch (e) {
      console.warn(`⚠️ Não foi possível carregar wtt_photo_map.json: ${e.message}. Usando fallbacks.`);
    }

    // Criar um Map para busca rápida
    const photoLookup = new Map(photoMap.map(item => [item.ittfid.toString(), item.headShot]));

    const menData = await fetchRankings('MS');
    const womenData = await fetchRankings('WS');

    const men = menData.Result || [];
    const women = womenData.Result || [];

    if (men.length > 0) {
      console.log('📝 Exemplo de dados do jogador:', JSON.stringify(men[0], null, 2));
    }

    console.log(`✅ Obtidos ${men.length} homens e ${women.length} mulheres.`);

    const playersToUpsert = [...men, ...women].map(p => {
      const ittfId = p.IttfId.toString();
      // Tenta pegar do mapa oficial, senão usa o padrão simplificado (fallback)
      let imageUrl = photoLookup.get(ittfId);
      
      // Se a URL do mapa oficial apontar para o Blob da WTT que as vezes falha, podemos tentar o photofiles
      if (imageUrl && imageUrl.includes('wttsimfiles.blob.core.windows.net')) {
         // Opcional: Manter como está ou redirecionar para a CDN principal photofiles.worldtabletennis.com
         // Por enquanto vamos usar o que o WTT usa oficialmente (headShot)
      }

      if (!imageUrl) {
        imageUrl = `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${p.PlayerName.replace(/\s+/g, '_')}.png`;
      }

      return {
        ittf_id: ittfId,
        name: p.PlayerName,
        rank: parseInt(p.CurrentRank),
        gender: p.SubEventCode === 'MS' ? 'male' : 'female',
        country_code: p.CountryCode,
        points: parseInt(p.RankingPointsYTD || '0'),
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase
      .from('players')
      .upsert(playersToUpsert, { onConflict: 'ittf_id' });

    if (error) throw error;

    console.log('🎉 Sincronização concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante a sincronização:', err.message);
  }
}

syncRankings();
