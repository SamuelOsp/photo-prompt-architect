import { Component, signal, inject, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';

const TRANSLATIONS: Record<string, any> = {
  en: {
    nav_title: "Photo Prompt Architect",
    hero_badge: "AI Image Analysis",
    hero_title_1: "Image to Prompt",
    hero_title_2: "Converter.",
    hero_desc: "Reverse-engineer your photos. Instantly generate detailed, professional prompts for Midjourney, FLUX, and other AI models.",
    upload_click: "Click to Upload Photo",
    upload_sub: "or Drag and Drop",
    change: "Change",
    clear: "Clear",
    analyzing: "Analyzing Structure...",
    gen_title: "Generated Prompt",
    copy: "Copy",
    copied: "Copied",
    empty_state: "Upload an image to see the generated prompt here.",
    btn_generate: "Generate Prompt",
    error_type: "Please upload a valid image file (JPG, PNG, WEBP).",
    error_read: "Failed to read file.",
    tip_title: "Generate with your Face",
    tip_desc: "To apply this style to your own likeness in Gemini:",
    step_1: "Copy the prompt generated above.",
    step_2: "Open Google Gemini.",
    step_3: "Upload 3 selfies of yourself + paste the prompt."
  },
  es: {
    nav_title: "Photo Prompt Architect",
    hero_badge: "Análisis de Imagen IA",
    hero_title_1: "De Imagen a Prompt",
    hero_title_2: "Convertidor.",
    hero_desc: "Ingeniería inversa para tus fotos. Genera instantáneamente prompts profesionales para Midjourney, FLUX y otros modelos de IA.",
    upload_click: "Clic para subir foto",
    upload_sub: "o arrastrar y soltar",
    change: "Cambiar",
    clear: "Limpiar",
    analyzing: "Analizando Estructura...",
    gen_title: "Prompt Generado",
    copy: "Copiar",
    copied: "Copiado",
    empty_state: "Sube una imagen para ver el prompt generado aquí.",
    btn_generate: "Generar Prompt",
    error_type: "Por favor sube una imagen válida (JPG, PNG, WEBP).",
    error_read: "Error al leer el archivo.",
    tip_title: "Genera con tu Cara",
    tip_desc: "Para obtener este resultado con tu rostro en Gemini:",
    step_1: "Copia el prompt generado arriba.",
    step_2: "Abre Google Gemini.",
    step_3: "Sube 3 selfies tuyas + pega el prompt y genera."
  },
  fr: {
    nav_title: "Photo Prompt Architect",
    hero_badge: "Analyse d'Image IA",
    hero_title_1: "Image vers Prompt",
    hero_title_2: "Convertisseur.",
    hero_desc: "Rétro-ingénierie de vos photos. Générez instantanément des prompts professionnels pour Midjourney, FLUX et d'autres modèles IA.",
    upload_click: "Cliquez pour télécharger",
    upload_sub: "ou glisser-déposer",
    change: "Changer",
    clear: "Effacer",
    analyzing: "Analyse de la structure...",
    gen_title: "Prompt Généré",
    copy: "Copier",
    copied: "Copié",
    empty_state: "Téléchargez une image pour voir le prompt généré ici.",
    btn_generate: "Générer le Prompt",
    error_type: "Veuillez télécharger une image valide (JPG, PNG, WEBP).",
    error_read: "Échec de la lecture du fichier.",
    tip_title: "Générer avec votre visage",
    tip_desc: "Pour appliquer ce style à votre propre image dans Gemini :",
    step_1: "Copiez le prompt généré ci-dessus.",
    step_2: "Ouvrez Google Gemini.",
    step_3: "Téléchargez 3 selfies de vous + collez le prompt."
  },
  pt: {
    nav_title: "Photo Prompt Architect",
    hero_badge: "Análise de Imagem IA",
    hero_title_1: "Imagem para Prompt",
    hero_title_2: "Conversor.",
    hero_desc: "Engenharia reversa das suas fotos. Gere instantaneamente prompts profissionais para Midjourney, FLUX e outros modelos de IA.",
    upload_click: "Clique para enviar",
    upload_sub: "ou arraste e solte",
    change: "Alterar",
    clear: "Limpar",
    analyzing: "Analisando Estrutura...",
    gen_title: "Prompt Gerado",
    copy: "Copiar",
    copied: "Copiado",
    empty_state: "Envie uma imagem para ver o prompt gerado aqui.",
    btn_generate: "Gerar Prompt",
    error_type: "Por favor, envie um arquivo de imagem válido (JPG, PNG, WEBP).",
    error_read: "Falha ao ler o arquivo.",
    tip_title: "Gere com seu Rosto",
    tip_desc: "Para obter esse resultado com sua aparência no Gemini:",
    step_1: "Copie o prompt gerado acima.",
    step_2: "Abra o Google Gemini.",
    step_3: "Envie 3 selfies suas + cole o prompt."
  },
  zh: {
    nav_title: "Photo Prompt Architect",
    hero_badge: "AI 图像分析",
    hero_title_1: "图像转提示词",
    hero_title_2: "转换器",
    hero_desc: "逆向工程您的照片。即刻为 Midjourney、FLUX 和其他 AI 模型生成详细、专业的提示词。",
    upload_click: "点击上传照片",
    upload_sub: "或拖放文件",
    change: "更改",
    clear: "清除",
    analyzing: "正在分析结构...",
    gen_title: "生成的提示词",
    copy: "复制",
    copied: "已复制",
    empty_state: "上传图片以在此处查看生成的提示词。",
    btn_generate: "生成提示词",
    error_type: "请上传有效的图像文件 (JPG, PNG, WEBP)。",
    error_read: "读取文件失败。",
    tip_title: "生成您的面孔",
    tip_desc: "要在 Gemini 中使用您的肖像应用此风格：",
    step_1: "复制上面生成的提示词。",
    step_2: "打开 Google Gemini。",
    step_3: "上传 3 张您的自拍 + 粘贴提示词。"
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  // State Signals
  imageSrc = signal<string | null>(null);
  mimeType = signal<string>('image/jpeg');
  isLoading = signal<boolean>(false);
  generatedPrompt = signal<string | null>(null);
  error = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  copySuccess = signal<boolean>(false);
  
  // Language State
  currentLang = signal<string>('en');
  
  // Computed Translations
  t = computed(() => TRANSLATIONS[this.currentLang()] || TRANSLATIONS['en']);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' }
  ];

  setLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.currentLang.set(select.value);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    // Reset state
    this.error.set(null);
    this.generatedPrompt.set(null);
    this.copySuccess.set(false);

    // Validate type
    if (!file.type.startsWith('image/')) {
      this.error.set(this.t().error_type);
      return;
    }

    this.mimeType.set(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageSrc.set(e.target?.result as string);
      // Auto-analyze on upload for smoother UX
      this.analyzeImage(); 
    };
    reader.onerror = () => {
      this.error.set(this.t().error_read);
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async analyzeImage() {
    const currentImage = this.imageSrc();
    if (!currentImage) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedPrompt.set(null);

    try {
      const prompt = await this.geminiService.generatePromptFromImage(currentImage, this.mimeType());
      this.generatedPrompt.set(prompt);
    } catch (err: any) {
      this.error.set(err.message || 'An unexpected error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  copyToClipboard() {
    const text = this.generatedPrompt();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  reset() {
    this.imageSrc.set(null);
    this.generatedPrompt.set(null);
    this.error.set(null);
    this.isLoading.set(false);
    // clear input value to allow re-selecting same file
    if(this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}