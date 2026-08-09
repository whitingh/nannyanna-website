import Heading from "@tiptap/extension-heading";

const ArticleHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      marker: {
        default: "none",

        parseHTML: (element) =>
          element.getAttribute("data-marker") || "none",

        renderHTML: (attributes) => {
          if (!attributes.marker || attributes.marker === "none") {
            return {};
          }

          return {
            "data-marker": attributes.marker,
          };
        },
      },
    };
  },
});

export default ArticleHeading;