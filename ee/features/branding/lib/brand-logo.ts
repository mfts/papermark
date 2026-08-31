import type { Brand, DataroomBrand } from "@prisma/client";

export type BrandLogoFields = {
  logo?: string | null;
  hideLogo?: boolean | null;
};

export type ResolvedBrandLogo =
  | { kind: "custom"; src: string }
  | { kind: "papermark" }
  | { kind: "none" };

type BrandLogoSource = BrandLogoFields & {
  logo?: string | null;
  hideLogo?: boolean | null;
};

export function resolveBrandLogo(
  brand?: BrandLogoSource | null,
): ResolvedBrandLogo {
  if (brand?.hideLogo) {
    return { kind: "none" };
  }

  if (typeof brand?.logo === "string" && brand.logo.trim().length > 0) {
    return { kind: "custom", src: brand.logo };
  }

  return { kind: "papermark" };
}

export function mergeBrandLogoFields(opts: {
  dataroom?: Partial<Pick<DataroomBrand, "logo" | "hideLogo">> | null;
  team?: Partial<Pick<Brand, "logo" | "hideLogo">> | null;
}): BrandLogoFields {
  return {
    logo: opts.dataroom?.logo ?? opts.team?.logo ?? null,
    hideLogo: opts.dataroom?.hideLogo ?? opts.team?.hideLogo ?? null,
  };
}