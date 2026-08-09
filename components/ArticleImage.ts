import Image from "@tiptap/extension-image";

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent ? this.parent() : {}),

      alignment: {
        default: "center",

        parseHTML: (element) => {
          const alignment = element.getAttribute("data-alignment");

          if (
            alignment === "left" ||
            alignment === "center" ||
            alignment === "right"
          ) {
            return alignment;
          }

          return "center";
        },

        renderHTML: (attributes) => ({
          "data-alignment": attributes.alignment || "center",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },
});

export default ArticleImage;