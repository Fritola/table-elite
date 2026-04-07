import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PLAYER_DETAIL_URL = 'https://wtt-ttu-connect-frontdoor-g6gwg6e2bgc6gdfm.a01.azurefd.net/Players/GetPlayers';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://worldtabletennis.com/',
  'Origin': 'https://worldtabletennis.com'
};

async function fetchPlayerDetail(ittfId) {
  const url = `${PLAYER_DETAIL_URL}?IttfId=${ittfId}`;
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) return null;
    const data = await response.json();
    return data.Result ? data.Result[0] : null;
  } catch (e) {
    console.error(`Erro ao buscar detalhes do ITTF ID ${ittfId}:`, e.message);
    return null;
  }
}

async function syncPlayerDetails() {
  console.log('🚀 Iniciando sincronização de detalhes técnicos (Top Jogadores)...');

  try {
    // Buscar os top 250 jogadores do banco
    const { data: players, error } = await supabase
      .from('players')
      .select('id, ittf_id, name')
      .order('rank', { ascending: true })
      .limit(250);

    if (error) throw error;
    console.log(`📊 Processando ${players.length} jogadores...`);

    for (const player of players) {
      if (!player.ittf_id) {
        console.log(`⚠️ Pulando ${player.name}: ITTF ID ausente.`);
        continue;
      }

      console.log(`🔍 Buscando detalhes para: ${player.name} (${player.ittf_id})...`);
      const details = await fetchPlayerDetail(player.ittf_id);

      if (details) {
        // Mapeamento de lateralidade para chaves de tradução
        let handValue = details.Handedness;
        if (handValue === 'Left Hand') handValue = 'left_handed';
        else if (handValue === 'Right Hand') handValue = 'right_handed';

        console.log(`📡 Dados recebidos: Hand: ${details.Handedness}, Grip: ${details.Grip}, Style: ${details.Style}`);

        const updates = {
          hand: handValue,
          grip: details.Grip,
          playing_style: details.Style ? details.Style.toLowerCase() : null,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('players')
          .update(updates)
          .eq('id', player.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${player.name}:`, updateError.message);
        } else {
          console.log(`✅ ${player.name} atualizado com sucesso.`);
        }
      } else {
        console.log(`❌ Detalhes não encontrados para ${player.name}.`);
      }

      // Pequeno delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('🎉 Sincronização de detalhes concluída!');
  } catch (err) {
    console.error('❌ Erro durante a sincronização:', err.message);
  }
}

syncPlayerDetails();
