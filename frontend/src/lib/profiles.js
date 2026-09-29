export const profileImage=profile=>profile?.media?.card_image||profile?.media?.hero_image||profile?.media?.logo_image||profile?.photo||'';
export const profileIdentity=profile=>profile?.profile_type==='person' ? profile?.media?.portrait_image||profile?.photo||profile?.media?.card_image||'' : profile?.media?.logo_image||profile?.media?.card_image||profile?.photo||'';
