// Sinhala dictionary. Mirrors en.js key-for-key.
const si = {
  nav: {
    home: "මුල් පිටුව", products: "නිෂ්පාදන", services: "සේවාවන්", packages: "පැකේජ",
    bookings: "ඔබගේ වෙන්කිරීම්", contact: "අප අමතන්න", gallery: "ගැලරිය", cart: "කරත්තය", login: "පිවිසෙන්න", dress: "ඇඳුම් සහ ආභරණ",
  },
  common: {
    search: "සොයන්න", addToCart: "කරත්තයට එක් කරන්න", checkout: "ගෙවීම", bookNow: "වෙන් කරන්න",
    viewDetails: "විස්තර බලන්න", confirm: "තහවුරු කරන්න", cancel: "අවලංගු කරන්න", save: "සුරකින්න",
    price: "මිල", all: "සියල්ල", loading: "පූරණය වෙමින්...", empty: "තවම කිසිවක් නැත.",
    firstName: "මුල් නම", lastName: "අවසන් නම", phone: "දුරකථන අංකය", date: "දිනය",
    time: "වේලාව", gender: "ස්ත්‍රී/පුරුෂ", male: "පිරිමි", female: "ගැහැණු", from: "සිට", off: "වට්ටම්",
    close: "වසන්න", remove: "ඉවත් කරන්න", quantity: "ගණන", total: "එකතුව", minutes: "විනා.",
    startingFrom: "ආරම්භක මිල", consultationNote: "මෙම සේවාව/පැකේජය ලබා ගැනීමට පෙර උපදේශනයක් අවශ්‍යයි \u2014 මිල වෙනස් විය හැක.",
  },
  home: {
    heroTitle: "ලස්සනට. දීප්තිමත්ව.",
    heroSubtitle: "ඔබ වෙනුවෙන් නිර්මාණය කළ premium සැලුන් සත්කාරය.",
    heroCtaServices: "සේවාවන් බලන්න", heroCtaPackages: "පැකේජ බලන්න", heroCtaProducts: "නිෂ්පාදන",
    howTitle: "අපගේ සේවාව ලබා ගන්නේ කෙසේද",
    featServices: "අපගේ සේවාවන්", featPackages: "විශේෂ පැකේජ", featProducts: "නිෂ්පාදන මිලදී ගන්න",
    ctaTitle: "නව පෙනුමකට සූදානම්ද?", ctaText: "අදම ඔබගේ වේලාව වෙන් කරගන්න.",
  },
  products: {
    title: "නිෂ්පාදන", subtitle: "කලින් ඇණවුම් කර වෙළඳසැලෙන් ලබා ගන්න.", searchPlaceholder: "නිෂ්පාදන සොයන්න",
    outOfStock: "තොගයේ නැත", added: "කරත්තයට එක් කරන ලදි",
  },
  services: {
    title: "සේවාවන්", subtitle: "අපගේ සැලුන් සේවාවන් බලන්න.", searchPlaceholder: "සේවාවන් සොයන්න",
    duration: "කාලය",
  },
  packages: {
    title: "පැකේජ", subtitle: "විශේෂ දිනයන් සඳහා පැකේජ.", searchPlaceholder: "පැකේජ සොයන්න",
  },
  cart: {
    title: "ඔබගේ කරත්තය", empty: "ඔබගේ කරත්තය හිස්ය.", pickupDate: "ලබා ගැනීමේ දිනය",
    yourDetails: "ඔබගේ විස්තර", placeOrder: "ඇණවුම තහවුරු කරන්න", subtotal: "උප එකතුව",
    pendingNote: "ඔබගේ ඇණවුම පොරොත්තුවෙන් පවතී. පරිපාලක තහවුරු කළ පසු ඔබට SMS පණිවිඩයක් ලැබෙනු ඇත.",
    orderPlaced: "ඇණවුම තහවුරු විය", browseProducts: "නිෂ්පාදන බලන්න",
  },
  bookings: {
    title: "ඔබගේ වෙන්කිරීම්", subtitle: "ඔබගේ ඇණවුම් සහ වෙන්කිරීම් සොයන්න.",
    enterPhone: "ඔබගේ දුරකථන අංකය ඇතුළත් කරන්න", track: "සොයන්න", noResults: "එම අංකයට ඇණවුම් හෝ වෙන්කිරීම් හමු නොවීය.",
    status: { pending: "පොරොත්තුවෙන්", confirm: "තහවුරු", rejected: "ප්‍රතික්ෂේප", paid: "ගෙවා ඇත" },
    order: "ඇණවුම", booking: "වෙන්කිරීම", pickup: "ලබා ගැනීම",
  },
  contact: {
    title: "අප අමතන්න", subtitle: "ඔබගෙන් ඇසීමට කැමතියි.",
    phone: "දුරකථනය", whatsapp: "WhatsApp", email: "ඊමේල්", address: "ලිපිනය", location: "සිතියමේ බලන්න",
    bookByPhone: "සේවාවක් වෙන් කිරීමට අප අමතන්න හෝ WhatsApp කරන්න.",
  },
  gallery: { title: "ගැලරිය", subtitle: "අපගේ වැඩ බලන්න." },
  dress: {
    title: "ඇඳුම් සහ ආභරණ", subtitle: "ඔබගේ විශේෂ දිනය සඳහා ඇඳුම් සහ ආභරණ කුලියට ගන්න.",
    searchPlaceholder: "ඇඳුම් සහ ආභරණ සොයන්න", available: "තිබේ", outOfStock: "සම්පූර්ණයෙන් වෙන්කර ඇත",
    selectVariant: "වර්ගය තෝරන්න", noOfItems: "ගණන", bringDate: "රැගෙන යන දිනය", deliverDate: "භාරදෙන දිනය",
    checkAvailability: "පවතීදැයි බලන්න", notEnough: "එම දිනවලට ප්‍රමාණවත් නැත",
    delayCharge: "ප්‍රමාද ගාස්තුව / දිනකට",
  },
  footer: { quickLinks: "සබැඳි", contact: "සම්බන්ධ වන්න", rights: "සියලු හිමිකම් ඇවිරිණි." },
};
export default si;
