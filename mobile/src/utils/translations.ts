import { Language } from "../types/app";

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

// Basic translations for the app
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Welcome
    welcomeTitle: "Welcome to SteadiDay",
    welcomeSubtitle: "Your simple app for reminders, tools, and staying connected.",
    getStarted: "Get Started",
    skipSetup: "Skip Setup",
    or: "or",

    // Language selection
    selectLanguage: "Select Your Language",
    chooseLanguage: "Choose your preferred language for the app",
    continue: "Continue",

    // Fall detection
    fallDetectionSetup: "Fall Detection",
    fallDetectionDescription: "Enable automatic fall detection for added safety. The app will alert your trusted contacts if a fall is detected.",
    enableFallDetection: "Enable Fall Detection",
    skipForNow: "Skip for now",

    // Home
    home: "Home",
    tasks: "Tasks",
    meds: "Meds",
    tools: "Tools",
    connect: "Connect",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    done: "Done",
    ok: "OK",
    yes: "Yes",
    no: "No",
  },
  es: {
    welcomeTitle: "Bienvenido a SteadiDay",
    welcomeSubtitle: "Tu aplicación simple para recordatorios, herramientas y mantenerte conectado.",
    getStarted: "Comenzar",
    skipSetup: "Saltar configuración",
    or: "o",

    selectLanguage: "Selecciona tu idioma",
    chooseLanguage: "Elige tu idioma preferido para la aplicación",
    continue: "Continuar",

    fallDetectionSetup: "Detección de caídas",
    fallDetectionDescription: "Habilita la detección automática de caídas para mayor seguridad. La aplicación alertará a tu contacto de emergencia si se detecta una caída.",
    enableFallDetection: "Habilitar detección de caídas",
    skipForNow: "Omitir por ahora",

    home: "Inicio",
    tasks: "Tareas",
    meds: "Medicamentos",
    tools: "Herramientas",
    connect: "Conectar",

    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Agregar",
    back: "Atrás",
    done: "Listo",
    ok: "OK",
    yes: "Sí",
    no: "No",
  },
  zh: {
    welcomeTitle: "欢迎使用 SteadiDay",
    welcomeSubtitle: "您的简单提醒、工具和保持联系的应用程序。",
    getStarted: "开始",
    skipSetup: "跳过设置",
    or: "或",

    selectLanguage: "选择您的语言",
    chooseLanguage: "选择您的首选语言",
    continue: "继续",

    fallDetectionSetup: "跌倒检测",
    fallDetectionDescription: "启用自动跌倒检测以提高安全性。如果检测到跌倒，应用程序将通知您的紧急联系人。",
    enableFallDetection: "启用跌倒检测",
    skipForNow: "暂时跳过",

    home: "主页",
    tasks: "任务",
    meds: "药物",
    tools: "工具",
    connect: "连接",

    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    back: "返回",
    done: "完成",
    ok: "确定",
    yes: "是",
    no: "否",
  },
  fr: {
    welcomeTitle: "Bienvenue dans SteadiDay",
    welcomeSubtitle: "Votre application simple pour les rappels, les outils et rester connecté.",
    getStarted: "Commencer",
    skipSetup: "Ignorer la configuration",
    or: "ou",

    selectLanguage: "Sélectionnez votre langue",
    chooseLanguage: "Choisissez votre langue préférée pour l'application",
    continue: "Continuer",

    fallDetectionSetup: "Détection de chute",
    fallDetectionDescription: "Activez la détection automatique des chutes pour plus de sécurité. L'application alertera votre contact d'urgence si une chute est détectée.",
    enableFallDetection: "Activer la détection de chute",
    skipForNow: "Passer pour l'instant",

    home: "Accueil",
    tasks: "Tâches",
    meds: "Médicaments",
    tools: "Outils",
    connect: "Connexion",

    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    back: "Retour",
    done: "Terminé",
    ok: "OK",
    yes: "Oui",
    no: "Non",
  },
  de: {
    welcomeTitle: "Willkommen bei SteadiDay",
    welcomeSubtitle: "Ihre einfache App für Erinnerungen, Tools und um in Verbindung zu bleiben.",
    getStarted: "Loslegen",
    skipSetup: "Einrichtung überspringen",
    or: "oder",

    selectLanguage: "Wählen Sie Ihre Sprache",
    chooseLanguage: "Wählen Sie Ihre bevorzugte Sprache für die App",
    continue: "Weiter",

    fallDetectionSetup: "Sturzerkennung",
    fallDetectionDescription: "Aktivieren Sie die automatische Sturzerkennung für zusätzliche Sicherheit. Die App benachrichtigt Ihren Notfallkontakt, wenn ein Sturz erkannt wird.",
    enableFallDetection: "Sturzerkennung aktivieren",
    skipForNow: "Vorerst überspringen",

    home: "Startseite",
    tasks: "Aufgaben",
    meds: "Medikamente",
    tools: "Werkzeuge",
    connect: "Verbinden",

    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    back: "Zurück",
    done: "Fertig",
    ok: "OK",
    yes: "Ja",
    no: "Nein",
  },
  it: {
    welcomeTitle: "Benvenuto in SteadiDay",
    welcomeSubtitle: "La tua app semplice per promemoria, strumenti e rimanere connesso.",
    getStarted: "Inizia",
    skipSetup: "Salta configurazione",
    or: "o",

    selectLanguage: "Seleziona la tua lingua",
    chooseLanguage: "Scegli la tua lingua preferita per l'app",
    continue: "Continua",

    fallDetectionSetup: "Rilevamento cadute",
    fallDetectionDescription: "Abilita il rilevamento automatico delle cadute per maggiore sicurezza. L'app avviserà il tuo contatto di emergenza se viene rilevata una caduta.",
    enableFallDetection: "Abilita rilevamento cadute",
    skipForNow: "Salta per ora",

    home: "Home",
    tasks: "Attività",
    meds: "Farmaci",
    tools: "Strumenti",
    connect: "Connetti",

    save: "Salva",
    cancel: "Annulla",
    delete: "Elimina",
    edit: "Modifica",
    add: "Aggiungi",
    back: "Indietro",
    done: "Fatto",
    ok: "OK",
    yes: "Sì",
    no: "No",
  },
  pt: {
    welcomeTitle: "Bem-vindo ao SteadiDay",
    welcomeSubtitle: "Seu aplicativo simples para lembretes, ferramentas e manter-se conectado.",
    getStarted: "Começar",
    skipSetup: "Pular configuração",
    or: "ou",

    selectLanguage: "Selecione seu idioma",
    chooseLanguage: "Escolha seu idioma preferido para o aplicativo",
    continue: "Continuar",

    fallDetectionSetup: "Detecção de quedas",
    fallDetectionDescription: "Ative a detecção automática de quedas para maior segurança. O aplicativo alertará seu contato de emergência se uma queda for detectada.",
    enableFallDetection: "Ativar detecção de quedas",
    skipForNow: "Pular por enquanto",

    home: "Início",
    tasks: "Tarefas",
    meds: "Medicamentos",
    tools: "Ferramentas",
    connect: "Conectar",

    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    add: "Adicionar",
    back: "Voltar",
    done: "Concluído",
    ok: "OK",
    yes: "Sim",
    no: "Não",
  },
  ja: {
    welcomeTitle: "SteadiDayへようこそ",
    welcomeSubtitle: "リマインダー、ツール、つながりを保つためのシンプルなアプリです。",
    getStarted: "始める",
    skipSetup: "セットアップをスキップ",
    or: "または",

    selectLanguage: "言語を選択",
    chooseLanguage: "アプリの優先言語を選択してください",
    continue: "続ける",

    fallDetectionSetup: "転倒検知",
    fallDetectionDescription: "安全性を高めるために自動転倒検知を有効にします。転倒が検知された場合、アプリが緊急連絡先に通知します。",
    enableFallDetection: "転倒検知を有効にする",
    skipForNow: "今はスキップ",

    home: "ホーム",
    tasks: "タスク",
    meds: "薬",
    tools: "ツール",
    connect: "接続",

    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    add: "追加",
    back: "戻る",
    done: "完了",
    ok: "OK",
    yes: "はい",
    no: "いいえ",
  },
  ko: {
    welcomeTitle: "SteadiDay에 오신 것을 환영합니다",
    welcomeSubtitle: "알림, 도구 및 연결 유지를 위한 간단한 앱입니다.",
    getStarted: "시작하기",
    skipSetup: "설정 건너뛰기",
    or: "또는",

    selectLanguage: "언어 선택",
    chooseLanguage: "앱의 선호 언어를 선택하세요",
    continue: "계속",

    fallDetectionSetup: "낙상 감지",
    fallDetectionDescription: "안전을 위해 자동 낙상 감지를 활성화합니다. 낙상이 감지되면 앱이 비상 연락처에 알립니다.",
    enableFallDetection: "낙상 감지 활성화",
    skipForNow: "나중에 하기",

    home: "홈",
    tasks: "작업",
    meds: "약물",
    tools: "도구",
    connect: "연결",

    save: "저장",
    cancel: "취소",
    delete: "삭제",
    edit: "편집",
    add: "추가",
    back: "뒤로",
    done: "완료",
    ok: "확인",
    yes: "예",
    no: "아니오",
  },
  hi: {
    // Welcome
    welcomeTitle: "SteadiDay में आपका स्वागत है",
    welcomeSubtitle: "रिमाइंडर, टूल और जुड़े रहने के लिए आपका आसान ऐप।",
    getStarted: "शुरू करें",
    skipSetup: "सेटअप छोड़ें",
    or: "या",

    // Language selection
    selectLanguage: "अपनी भाषा चुनें",
    chooseLanguage: "ऐप के लिए अपनी पसंदीदा भाषा चुनें",
    continue: "आगे बढ़ें",

    // Fall detection
    fallDetectionSetup: "गिरने का पता लगाना",
    fallDetectionDescription: "अतिरिक्त सुरक्षा के लिए गिरने का अपने-आप पता लगाना चालू करें। गिरने का पता चलने पर ऐप आपके आपातकालीन संपर्क को सूचित करेगा।",
    enableFallDetection: "गिरने का पता लगाना चालू करें",
    skipForNow: "अभी छोड़ें",

    // Home
    home: "होम",
    tasks: "कार्य",
    meds: "दवाइयाँ",
    tools: "टूल",
    connect: "जुड़ें",

    // Common
    save: "सेव करें",
    cancel: "रद्द करें",
    delete: "हटाएँ",
    edit: "बदलें",
    add: "जोड़ें",
    back: "वापस",
    done: "हो गया",
    ok: "ठीक है",
    yes: "हाँ",
    no: "नहीं",
  },
};

export const t = (key: string, language: Language = "en"): string => {
  return translations[language]?.[key] || translations.en[key] || key;
};
