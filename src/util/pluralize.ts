export function pluralize(word: string, qty: number) {
   switch (word) {
      case "page":
         if (qty === 1) return "page";
         return "pages";
      case "match":
         if (qty === 1) return "match";
         return "matches";
      case "category":
         if (qty === 1) return "category";
         return "categories";
   }
}
