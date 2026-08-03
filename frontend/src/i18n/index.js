import { ref, computed } from 'vue'

const currentLocale = ref('ES') // Default to Spanish

const dictionary = {
  ES: {
    // Header & Badges
    status_skill_ready: 'Skill Lista',
    status_skill_missing: 'Skill Missing',
    live_cli_wrapper: 'WRAPPER CLI EN VIVO',
    '30day_hub': 'CENTRO DE INTELIGENCIA 30 DÍAS',

    // Search & Filters
    search_placeholder: 'Investigar tema de IA o tendencia...',
    investigate_btn: 'INVESTIGAR',
    investigating_btn: 'EJECUTANDO...',
    sources_title: 'FUENTES DE INTELIGENCIA',
    timeframe_title: 'FRESCURA TEMPORAL',
    bypass_cache: 'Omitir Caché 12h',
    days_suffix: 'DÍAS',
    query_title: 'Signal Query',
    query_sub: 'Ingesta de señales de mercado, sentimiento e inteligencia técnica.',

    // Metrics Overview
    volume_title: 'Volumen Menciones',
    volume_sub: 'actividad relevante',
    dominant_source: 'Fuente Dominante',
    dominant_sub: 'Mayor concentración de debate',
    top_keywords: 'Top 5 Palabras Clave',

    // Results & Report
    real_data_badge: 'INFORME DE INTELIGENCIA — DATOS REALES',
    signals_detected: 'SEÑALES DETECTADAS',
    detected_feeds: 'FEEDS DETECTADOS',
    source_link: 'Origen',
    export_pdf: 'PDF',
    export_json: 'JSON',
    export_md: 'MD',
    noSourceResults: 'Sin resultados para la fuente seleccionada.',
    allSources: 'Todos',
    by: 'por',

    // History
    new_research_btn: '+ NUEVA INVESTIGACIÓN',
    records_title: 'EXPEDIENTES DE SESIÓN',
    search_history_placeholder: 'Buscar expediente...',
    confirm_delete_title: '¿Eliminar expediente?',
    noSavedSessions: 'Sin expedientes guardados',
    ago: 'hace',

    // Chat
    chat_title: 'Chat de Seguimiento e Interrogación',
    chat_topic: 'Topic',
    chat_empty: 'Haz una pregunta de seguimiento sobre este informe.',
    chat_placeholder: 'Haz una pregunta de seguimiento sobre este informe...',
    chat_send: 'Enviar',
    chat_quick_prompts: 'Preguntas Rápidas',

    // Progress Overlay
    connecting: 'Iniciando conexión con Signal Intelligence Core…',
    loadingRecord: 'Cargando expediente desde base de datos…',
    pipelineRunning: 'Pipeline de Inteligencia en Ejecución',
  },
  EN: {
    // Header & Badges
    status_skill_ready: 'Skill Ready',
    status_skill_missing: 'Skill Missing',
    live_cli_wrapper: 'LIVE CLI WRAPPER',
    '30day_hub': '30-DAY INTELLIGENCE HUB',

    // Search & Filters
    search_placeholder: 'Investigate AI topic or trend...',
    investigate_btn: 'INVESTIGATE',
    investigating_btn: 'EXECUTING...',
    sources_title: 'INTELLIGENCE SOURCES',
    timeframe_title: 'TIMEFRAME',
    bypass_cache: 'Bypass 12h Cache',
    days_suffix: 'DAYS',
    query_title: 'Signal Query',
    query_sub: 'Market signals, sentiment and technical intelligence ingestion.',

    // Metrics Overview
    volume_title: 'Mention Volume',
    volume_sub: 'relevant activity',
    dominant_source: 'Dominant Source',
    dominant_sub: 'Highest debate concentration',
    top_keywords: 'Top 5 Keywords',

    // Results & Report
    real_data_badge: 'INTELLIGENCE REPORT — REAL DATA',
    signals_detected: 'SIGNALS DETECTED',
    detected_feeds: 'DETECTED FEEDS',
    source_link: 'Source',
    export_pdf: 'PDF',
    export_json: 'JSON',
    export_md: 'MD',
    noSourceResults: 'No results for the selected source.',
    allSources: 'All',
    by: 'by',

    // History
    new_research_btn: '+ NEW RESEARCH',
    records_title: 'SESSION RECORDS',
    search_history_placeholder: 'Search record...',
    confirm_delete_title: 'Delete record permanently?',
    noSavedSessions: 'No saved records',
    ago: 'ago',

    // Chat
    chat_title: 'Follow-up & Interrogation Chat',
    chat_topic: 'Topic',
    chat_empty: 'Ask a follow-up question about this report.',
    chat_placeholder: 'Ask a follow-up question about this report...',
    chat_send: 'Send',
    chat_quick_prompts: 'Quick Prompts',

    // Progress Overlay
    connecting: 'Initiating connection with Signal Intelligence Core…',
    loadingRecord: 'Loading record from database…',
    pipelineRunning: 'Intelligence Pipeline Running',
  }
}

export function useI18n() {
  function toggleLocale() {
    currentLocale.value = currentLocale.value === 'ES' ? 'EN' : 'ES'
  }

  function t(key) {
    const localeDict = dictionary[currentLocale.value]
    if (localeDict && localeDict[key] !== undefined) {
      return localeDict[key]
    }
    console.warn(`Translation key not found: ${key}`)
    return key
  }

  return {
    locale: currentLocale,
    toggleLocale,
    t
  }
}
