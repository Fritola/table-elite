import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SCHEDULE_URL = 'https://liveeventsapi.worldtabletennis.com/api/cms/GetEventSchedule';

const HEADERS = {
  'Origin': 'https://www.worldtabletennis.com',
  'Referer': 'https://www.worldtabletennis.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// Lista de eventos capturada via browser (Fallback se a API JSON principal falhar)
const EVENTS_MANUAL = [
  { eventId: 3237, eventName: "WTT Contender Taiyuan 2026" },
  { eventId: 3297, eventName: "WTT Youth Contender Novi Sad 2026" },
  { eventId: 3236, eventName: "WTT Contender Tunis 2026" },
  { eventId: 3356, eventName: "WTT Feeder Varazdin 2026" },
  { eventId: 3235, eventName: "WTT Champions Chongqing 2026" }
];

async function syncSchedule() {
  console.log('📅 Iniciando sincronização inteligente da Agenda...');

  try {
    // 1. Carregar Top 100/500
    const { data: topPlayers } = await supabase
      .from('players')
      .select('id, ittf_id, rank')
      .lte('rank', 500);

    const playerMap = new Map();
    topPlayers?.forEach(p => {
      if (p.ittf_id) playerMap.set(p.ittf_id.toString(), { id: p.id, rank: p.rank });
    });
    console.log(`✅ ${playerMap.size} jogadores de referência carregados.`);

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Data de hoje (UTC): ${today}`);

    for (const event of EVENTS_MANUAL) {
      console.log(`🔎 Processando ${event.eventName} (ID: ${event.eventId})...`);
      
      const url = `${SCHEDULE_URL}/${event.eventId}`;
      const response = await fetch(url, { headers: HEADERS });
      
      if (!response.ok) {
          console.warn(`  ⚠️ Falha ao buscar agenda do evento ${event.eventId}`);
          continue;
      }

      const text = await response.text();
      if (!text || text.startsWith('<!DOCTYPE')) continue;

      let competitionData;
      try {
        competitionData = JSON.parse(text);
      } catch (e) { continue; }

      const matchesToSync = [];
      let eliteCount = 0;

      for (const item of competitionData) {
        // A API da WTT agrupa unidades dentro de "Competition" ou às vezes retorna direto
        const units = item.Competition?.Unit || item.Unit || (item.Code ? [item] : []);
        
        for (const unit of units) {
          if (!unit.StartDate || !unit.SubEvent) continue;
          
          const subEvent = unit.SubEvent || '';
          const isSingles = subEvent.toLowerCase().includes('single') || subEvent.toLowerCase().includes('singular');
          if (!isSingles) continue;

          const competitors = unit.StartList?.Start || [];
          const p1_data = competitors[0]?.Competitor;
          const p2_data = competitors[1]?.Competitor;
          
          const p1_ittf = p1_data?.Description?.IfId?.toString();
          const p2_ittf = p2_data?.Description?.IfId?.toString();

          const p1_info = p1_ittf ? playerMap.get(p1_ittf) : null;
          const p2_info = p2_ittf ? playerMap.get(p2_ittf) : null;

          const isTop50 = (p1_info && p1_info.rank <= 50) || (p2_info && p2_info.rank <= 50);
          
          // Lógica de hoje: Se a data começar com a data de hoje ou se for MM/DD/YYYY
          // Ex: "2026-04-07" ou "04/07/2026"
          const isToday = unit.StartDate.includes(today) || unit.StartDate.includes('04/07/2026');

          if (isTop50 || isToday) {
            if (isTop50) eliteCount++;

            matchesToSync.push({
              wtt_match_id: unit.Code,
              wtt_event_id: event.eventId.toString(),
              tournament: event.eventName,
              scheduled_at: unit.StartDate,
              status: unit.ScheduleStatus?.toLowerCase() === 'official' ? 'finished' : 'scheduled',
              category: unit.SubEvent,
              round_name: unit.Draw || 'Qualificação',
              player1_id: p1_info?.id || null,
              player2_id: p2_info?.id || null,
              player1_name: p1_data?.Description?.TeamName || 'TBD',
              player2_name: p2_data?.Description?.TeamName || 'TBD',
              is_priority: isTop50
            });
          }
        }
      }

      if (matchesToSync.length > 0) {
        // Ordenar: Prioridade (Top 50) primeiro
        matchesToSync.sort((a,b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
        
        // Remover duplicatas de wtt_match_id (caso o mesmo Unit Code apareça em múltiplas competições)
        const uniqueMatchesMap = new Map();
        for (const m of matchesToSync) {
          if (!uniqueMatchesMap.has(m.wtt_match_id)) {
            uniqueMatchesMap.set(m.wtt_match_id, m);
          }
        }
        
        const finalMatches = Array.from(uniqueMatchesMap.values()).slice(0, 40);
        console.log(`  🏟️  Encontradas ${finalMatches.length} partidas únicas (Top 50: ${eliteCount > 0 ? 'Sim' : 'Não'})`);
        
        const { error } = await supabase
          .from('matches')
          .upsert(finalMatches.map(({ is_priority, ...m }) => m), { onConflict: 'wtt_match_id' });

        if (error) console.error(`  ❌ Erro no upsert: ${error.message}`);
        else console.log(`  🎉 Sucesso!`);
      }
    }

    console.log('🏁 Sincronização inteligente concluída!');
  } catch (err) {
    console.error('❌ Erro global:', err.message);
  }
}

syncSchedule();
