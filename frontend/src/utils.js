/**
 * Helper to convert a Vietnamese string into an unsigned, hyphenated slug.
 * Example: "Xin chào mọi người!" -> "xin-chao-moi-nguoi"
 */
export function toSlug(str) {
  if (!str) return '';
  
  // Convert to lowercase
  let slug = str.toLowerCase();
  
  // Remove accents / tones
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
  slug = slug.replace(/[ìíịỉĩ]/g, 'i');
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, 'u');
  slug = slug.replace(/[ỳýỵỷỹ]/g, 'y');
  slug = slug.replace(/đ/g, 'd');
  
  // Remove special characters (keep alphanumeric, space, and hyphen)
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Replace spaces and multiple hyphens with a single hyphen
  slug = slug.trim().replace(/[\s-]+/g, '-');
  
  return slug;
}
