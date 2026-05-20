import { TaskCategory, TaskFrequency } from "../types/app";

export interface TaskTemplate {
  id: string;
  title: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  description: string;
  defaultTime?: string;
  reminderMinutes?: number;
  icon: string;
}

export interface TaskTemplateCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  templates: TaskTemplate[];
}

export const TASK_TEMPLATE_CATEGORIES: TaskTemplateCategory[] = [
  {
    id: "health-appointments",
    name: "Health Appointments",
    icon: "medical",
    description: "Regular checkups and screenings to stay healthy",
    templates: [
      {
        id: "annual-physical",
        title: "Schedule Annual Physical",
        category: "medical",
        frequency: "yearly",
        description: "Yearly wellness exam with your primary care doctor",
        defaultTime: "09:00",
        reminderMinutes: 10080,
        icon: "fitness",
      },
      {
        id: "dental-cleaning",
        title: "Dental Cleaning",
        category: "medical",
        frequency: "monthly",
        description: "Professional teeth cleaning every 6 months",
        defaultTime: "10:00",
        reminderMinutes: 10080,
        icon: "happy",
      },
      {
        id: "eye-exam",
        title: "Eye Exam",
        category: "medical",
        frequency: "yearly",
        description: "Annual vision checkup and prescription update",
        defaultTime: "10:00",
        reminderMinutes: 10080,
        icon: "eye",
      },
      {
        id: "hearing-test",
        title: "Hearing Test",
        category: "medical",
        frequency: "yearly",
        description: "Regular hearing evaluation (recommended every 3 years after 60)",
        defaultTime: "10:00",
        reminderMinutes: 10080,
        icon: "ear",
      },
      {
        id: "flu-shot",
        title: "Get Flu Shot",
        category: "medical",
        frequency: "yearly",
        description: "Annual flu vaccination (best in September-October)",
        defaultTime: "10:00",
        reminderMinutes: 1440,
        icon: "bandage",
      },
      {
        id: "dermatologist",
        title: "Skin Check",
        category: "medical",
        frequency: "yearly",
        description: "Annual skin cancer screening with dermatologist",
        defaultTime: "10:00",
        reminderMinutes: 10080,
        icon: "sunny",
      },
    ],
  },
  {
    id: "home-safety",
    name: "Home Safety",
    icon: "home",
    description: "Keep your home safe and well-maintained",
    templates: [
      {
        id: "smoke-detector",
        title: "Test Smoke Detectors",
        category: "personal",
        frequency: "monthly",
        description: "Press test button on all smoke and CO detectors",
        defaultTime: "10:00",
        reminderMinutes: 60,
        icon: "alert-circle",
      },
      {
        id: "smoke-detector-battery",
        title: "Replace Smoke Detector Batteries",
        category: "personal",
        frequency: "monthly",
        description: "Change batteries in smoke and CO detectors every 6 months",
        defaultTime: "10:00",
        reminderMinutes: 1440,
        icon: "battery-half",
      },
      {
        id: "fire-extinguisher",
        title: "Check Fire Extinguisher",
        category: "personal",
        frequency: "monthly",
        description: "Make sure extinguisher is charged and accessible",
        defaultTime: "10:00",
        reminderMinutes: 60,
        icon: "flame",
      },
      {
        id: "hvac-filter",
        title: "Change Air Filter",
        category: "personal",
        frequency: "monthly",
        description: "Replace HVAC air filter for better air quality",
        defaultTime: "10:00",
        reminderMinutes: 1440,
        icon: "cloud",
      },
      {
        id: "emergency-kit",
        title: "Review Emergency Kit",
        category: "personal",
        frequency: "monthly",
        description: "Check flashlights, batteries, first aid supplies, and water",
        defaultTime: "10:00",
        reminderMinutes: 60,
        icon: "medical-outline",
      },
    ],
  },
  {
    id: "wellness",
    name: "Daily Wellness",
    icon: "heart",
    description: "Healthy habits for every day",
    templates: [
      {
        id: "take-walk",
        title: "Take a Walk",
        category: "personal",
        frequency: "daily",
        description: "30 minutes of walking for heart and bone health",
        defaultTime: "09:00",
        reminderMinutes: 15,
        icon: "walk",
      },
      {
        id: "drink-water",
        title: "Hydration Check",
        category: "personal",
        frequency: "daily",
        description: "Aim for 6-8 glasses of water throughout the day",
        defaultTime: "12:00",
        reminderMinutes: 0,
        icon: "water",
      },
      {
        id: "stretch",
        title: "Morning Stretch",
        category: "personal",
        frequency: "daily",
        description: "Gentle stretching to maintain flexibility",
        defaultTime: "08:00",
        reminderMinutes: 0,
        icon: "body",
      },
      {
        id: "blood-pressure",
        title: "Check Blood Pressure",
        category: "medical",
        frequency: "weekly",
        description: "Monitor blood pressure at home",
        defaultTime: "09:00",
        reminderMinutes: 15,
        icon: "pulse",
      },
    ],
  },
  {
    id: "social-connection",
    name: "Social Connection",
    icon: "people",
    description: "Stay connected with loved ones",
    templates: [
      {
        id: "call-family",
        title: "Call Family or Friend",
        category: "personal",
        frequency: "weekly",
        description: "Regular check-in with loved ones",
        defaultTime: "14:00",
        reminderMinutes: 60,
        icon: "call",
      },
      {
        id: "video-call",
        title: "Video Call with Grandkids",
        category: "personal",
        frequency: "weekly",
        description: "FaceTime or video chat with family",
        defaultTime: "16:00",
        reminderMinutes: 60,
        icon: "videocam",
      },
    ],
  },
  {
    id: "finances",
    name: "Financial Tasks",
    icon: "card",
    description: "Stay on top of bills and finances",
    templates: [
      {
        id: "review-bank",
        title: "Review Bank Statement",
        category: "errand",
        frequency: "monthly",
        description: "Check accounts for unusual activity",
        defaultTime: "10:00",
        reminderMinutes: 1440,
        icon: "cash",
      },
      {
        id: "review-medicare",
        title: "Review Medicare Coverage",
        category: "errand",
        frequency: "yearly",
        description: "Check Medicare options during open enrollment (Oct-Dec)",
        defaultTime: "10:00",
        reminderMinutes: 10080,
        icon: "document-text",
      },
    ],
  },
  {
    id: "self-care",
    name: "Self Care",
    icon: "sparkles",
    description: "Take care of yourself",
    templates: [
      {
        id: "haircut",
        title: "Schedule Haircut",
        category: "personal",
        frequency: "monthly",
        description: "Regular haircut or salon appointment",
        defaultTime: "10:00",
        reminderMinutes: 1440,
        icon: "cut",
      },
      {
        id: "hobby-time",
        title: "Hobby Time",
        category: "personal",
        frequency: "weekly",
        description: "Dedicate time to something you enjoy",
        defaultTime: "14:00",
        reminderMinutes: 60,
        icon: "color-palette",
      },
      {
        id: "gratitude",
        title: "Gratitude Moment",
        category: "personal",
        frequency: "daily",
        description: "Take a moment to appreciate something good",
        defaultTime: "20:00",
        reminderMinutes: 0,
        icon: "heart",
      },
    ],
  },
];

export function getAllTemplates(): TaskTemplate[] {
  return TASK_TEMPLATE_CATEGORIES.flatMap((category) => category.templates);
}

export function templateToTaskData(template: TaskTemplate) {
  const now = new Date();
  if (template.defaultTime) {
    const [hours, minutes] = template.defaultTime.split(":").map(Number);
    now.setHours(hours, minutes, 0, 0);
  }
  return {
    title: template.title,
    category: template.category,
    frequency: template.frequency,
    date: now.toISOString(),
    time: template.defaultTime,
    reminderEnabled: true,
    reminderMinutes: template.reminderMinutes ?? 15,
    notes: template.description,
  };
}
