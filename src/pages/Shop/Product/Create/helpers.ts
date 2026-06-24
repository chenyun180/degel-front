export type SkuAttributeInput = {
  key?: string;
  value?: string;
};

export function serializeSkuAttributes(
  attributes: SkuAttributeInput[] = [],
): string {
  const specData = attributes.reduce<Record<string, string>>((acc, item) => {
    const key = item.key?.trim();
    const value = item.value?.trim();
    if (!key || !value) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

  return JSON.stringify(specData);
}

export function parseSkuAttributes(specData?: string): SkuAttributeInput[] {
  if (!specData) {
    return [];
  }

  try {
    const parsed = JSON.parse(specData) as Record<string, string>;
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      value,
    }));
  } catch {
    return [];
  }
}

export function splitImageUrls(images?: string): string[] {
  if (!images) {
    return [];
  }

  return images
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinImageUrls(images: string[] = []): string {
  return images.map((item) => item.trim()).filter(Boolean).join(',');
}
