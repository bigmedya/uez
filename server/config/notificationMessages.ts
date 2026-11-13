export interface ProgramNotificationTemplates {
  /** Oturum başlangıç saatinde */
  sessionStarting: {
    title: string;
    titleNoTitle: string;
  };
  speakerAdded: {
    title: string;
    message: string;
    messageNoTitle: string;
  };
  newItem: {
    title: string;
    message: string;
    messageNoTitle: string;
  };
  newDay: {
    title: string;
    message: string;
  };
  newCategory: {
    title: string;
    message: string;
  };
}

const defaultTemplates: ProgramNotificationTemplates = {
  sessionStarting: {
    title: "{{title}} — {{time}}",
    titleNoTitle: "UEZ — {{time}}",
  },
  speakerAdded: {
    title: "UEZ 2026 programında yeni bir isim!",
    message: "{{speakerNames}}, {{time}}'de \"{{title}}\" oturumunda konuşacak.",
    messageNoTitle: "{{speakerNames}}, {{time}}'de konuşacak.",
  },
  newItem: {
    title: "UEZ 2026 programı güncellendi",
    message: "{{time}}'de \"{{title}}\" oturumu programa eklendi.",
    messageNoTitle: "{{time}}'de yeni bir oturum programa eklendi.",
  },
  newDay: {
    title: "UEZ 2026 programında yeni bir isim!",
    message: "{{dayTitle}} günü program akışına eklendi.",
  },
  newCategory: {
    title: "UEZ 2026 programında yeni bir isim!",
    message: "{{categoryName}} başlığı altında yeni oturumlar programa eklendi.",
  },
};

export const programNotificationTemplates: ProgramNotificationTemplates =
  defaultTemplates;

export function replacePlaceholders(
  text: string,
  values: Record<string, string>
): string {
  let out = text;
  for (const [key, value] of Object.entries(values)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return out.replace(/\{\{[^}]+\}\}/g, "").trim();
}
