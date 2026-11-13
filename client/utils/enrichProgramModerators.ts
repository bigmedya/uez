/** Program satırındaki moderatörleri /api/speakers ile aynı kaynaktan gelen alanlarla tamamlar (şirket, pozisyon, unvan). */

export type SpeakerCatalogEntry = {
  id?: number;
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
};

export type ProgramModeratorFields = {
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
};

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function enrichModeratorsWithSpeakerCatalog(
  moderatorIds: number[] | undefined,
  moderatorsFromApi: ProgramModeratorFields[] | undefined,
  legacyModerator: string | undefined,
  legacyModeratorTitle: string | undefined,
  catalog: SpeakerCatalogEntry[],
): ProgramModeratorFields[] {
  const fromApi: ProgramModeratorFields[] =
    (moderatorsFromApi?.length ?? 0) > 0
      ? moderatorsFromApi
      : legacyModerator
        ? [{ name: legacyModerator, title: legacyModeratorTitle }]
        : [];

  if (moderatorIds && moderatorIds.length > 0) {
    return moderatorIds
      .map((id, i) => {
        const sp = catalog.find((s) => s.id === id);
        const apiRow = fromApi[i];
        if (!sp) return apiRow ?? { name: "" };
        const photoFromApi = apiRow?.photo?.trim();
        return {
          name: sp.name,
          title: apiRow?.title?.trim() ? apiRow.title : sp.title,
          titleEn: apiRow?.titleEn ?? sp.titleEn,
          photo: photoFromApi || sp.photo?.trim() || "",
          company: sp.company,
          companyEn: sp.companyEn,
          position: sp.position,
          positionEn: sp.positionEn,
        };
      })
      .filter((m) => m.name.trim().length > 0);
  }

  return fromApi
    .map((mod) => {
      const sp = catalog.find((s) => normName(s.name) === normName(mod.name));
      if (!sp) return mod;
      const photoFromMod = mod.photo?.trim();
      return {
        ...mod,
        title: mod.title?.trim() ? mod.title : sp.title,
        titleEn: mod.titleEn ?? sp.titleEn,
        photo: photoFromMod || sp.photo?.trim() || "",
        company: mod.company?.trim() ? mod.company : sp.company,
        companyEn: mod.companyEn?.trim() ? mod.companyEn : sp.companyEn,
        position: mod.position?.trim() ? mod.position : sp.position,
        positionEn: mod.positionEn?.trim() ? mod.positionEn : sp.positionEn,
      };
    })
    .filter((m) => m.name.trim().length > 0);
}
