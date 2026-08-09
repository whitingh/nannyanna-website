"use client";

import { useEffect } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ArticleImage from "@/components/ArticleImage";
import { supabase } from "@/lib/supabase";
import ArticleHeading from "@/components/ArticleHeading";
import Placeholder from "@tiptap/extension-placeholder";

type ArticleEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ArticleEditor({
  content,
  onChange,
}: ArticleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
  heading: false,
}),

ArticleHeading.configure({
  levels: [2, 3],
}),,

      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-[#527A5A] underline",
        },
      }),

      ArticleImage.configure({
        HTMLAttributes: {
          class: "article-inline-image",
        },
      }),

      Placeholder.configure({
  placeholder: "Write the article here...",
}),
    ],

    content,

    editorProps: {
      attributes: {
        class:
          "article-editor min-h-[420px] px-5 py-4 leading-8 outline-none",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const imageState = useEditorState({
  editor,

  selector: ({ editor }) => {
    if (!editor) {
      return {
        selected: false,
        alignment: "center",
      };
    }

    const selected = editor.isActive("image");

    return {
      selected,
      alignment: selected
        ? editor.getAttributes("image").alignment || "center"
        : "center",
    };
  },
});

  useEffect(() => {
  if (!editor) return;

  if (editor.getHTML() !== content) {
    editor.commands.setContent(content, {
      emitUpdate: false,
    });
  }
}, [content, editor]);

  function validateImage(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Please upload a JPG, PNG or WebP image.");
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Please choose an image smaller than 5 MB.");
      return false;
    }

    return true;
  }

  async function uploadImage(file: File) {
    if (!editor) return;

    if (!validateImage(file)) return;

    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `articles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Something went wrong uploading the image.");
      return;
    }

    const { data } = supabase.storage
      .from("article-images")
      .getPublicUrl(filePath);

    editor
      .chain()
      .focus()
      .setImage({
  src: data.publicUrl,
  alt: file.name,
})
.updateAttributes("image", {
  alignment: "center",
})
      .run();
  }

  async function deleteSelectedImage() {
    if (!editor || !editor.isActive("image")) {
      alert("Click an image in the article first.");
      return;
    }

    const src = editor.getAttributes("image").src as string;

    if (!src) return;

    const confirmed = window.confirm(
      "Delete this image from the article?"
    );

    if (!confirmed) return;

    editor.chain().focus().deleteSelection().run();

    const marker =
      "/storage/v1/object/public/article-images/";

    if (src.includes(marker)) {
      const filePath = decodeURIComponent(
        src.split(marker)[1]
      );

      const { error } = await supabase.storage
        .from("article-images")
        .remove([filePath]);

      if (error) {
        console.error(error);
        alert(
          "The image was removed from the article, but its stored file could not be deleted."
        );
      }
    }
  }

  function setImageAlignment(
  alignment: "left" | "center" | "right"
) {
  if (!editor) return;

  if (!imageState.selected) {
    alert("Click an image first.");
    return;
  }

  editor
    .chain()
    .focus()
    .updateAttributes("image", {
      alignment,
    })
    .run();
}

  function addLink() {
    if (!editor) return;

    const previousUrl =
      editor.getAttributes("link").href || "";

    const url = window.prompt(
      "Enter the link address:",
      previousUrl
    );

    if (url === null) return;

    if (url === "") {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  if (!editor) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#FAFCFA] p-5">
        Loading editor...
      </div>
    );
  }

  const buttonClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-[#E8F3E8]";

  const activeButtonClass =
    "rounded-lg border border-[#527A5A] bg-[#E8F3E8] px-3 py-2 text-sm font-semibold text-[#527A5A]";

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#FAFCFA]">
      <div className="flex flex-wrap gap-2 border-b border-black/10 bg-white p-3">
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().setParagraph().run()
          }
          className={
            editor.isActive("paragraph")
              ? activeButtonClass
              : buttonClass
          }
        >
          Text
        </button>

        <button
  type="button"
  onClick={() => {
    editor
      .chain()
      .focus()
      .toggleHeading({ level: 2 })
      .updateAttributes("heading", { marker: "none" })
      .run();
  }}
  className={
    editor.isActive("heading", { level: 2 }) &&
    (editor.getAttributes("heading").marker || "none") === "none"
      ? activeButtonClass
      : buttonClass
  }
>
  Heading
</button>

        <button
  type="button"
  onClick={() => {
    editor
      .chain()
      .focus()
      .toggleHeading({ level: 3 })
      .updateAttributes("heading", { marker: "none" })
      .run();
  }}
  className={
    editor.isActive("heading", { level: 3 }) &&
    (editor.getAttributes("heading").marker || "none") === "none"
      ? activeButtonClass
      : buttonClass
  }
>
  Subheading
</button>

<button
  type="button"
  onClick={() =>
    editor
      .chain()
      .focus()
      .setHeading({ level: 2 })
      .updateAttributes("heading", { marker: "number" })
      .run()
  }
  className={
    editor.isActive("heading", { level: 2 }) &&
    editor.getAttributes("heading").marker === "number"
      ? activeButtonClass
      : buttonClass
  }
>
  1. Heading
</button>

<button
  type="button"
  onClick={() =>
    editor
      .chain()
      .focus()
      .setHeading({ level: 3 })
      .updateAttributes("heading", { marker: "number" })
      .run()
  }
  className={
    editor.isActive("heading", { level: 3 }) &&
    editor.getAttributes("heading").marker === "number"
      ? activeButtonClass
      : buttonClass
  }
>
  1. Subheading
</button>

<button
  type="button"
  onClick={() =>
    editor
      .chain()
      .focus()
      .setHeading({ level: 2 })
      .updateAttributes("heading", { marker: "bullet" })
      .run()
  }
  className={
    editor.isActive("heading", { level: 2 }) &&
    editor.getAttributes("heading").marker === "bullet"
      ? activeButtonClass
      : buttonClass
  }
>
  • Heading
</button>

<button
  type="button"
  onClick={() =>
    editor
      .chain()
      .focus()
      .setHeading({ level: 3 })
      .updateAttributes("heading", { marker: "bullet" })
      .run()
  }
  className={
    editor.isActive("heading", { level: 3 }) &&
    editor.getAttributes("heading").marker === "bullet"
      ? activeButtonClass
      : buttonClass
  }
>
  • Subheading
</button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={
            editor.isActive("bold")
              ? activeButtonClass
              : buttonClass
          }
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={
            editor.isActive("italic")
              ? activeButtonClass
              : buttonClass
          }
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className={
            editor.isActive("bulletList")
              ? activeButtonClass
              : buttonClass
          }
        >
          Bullets
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          className={
            editor.isActive("orderedList")
              ? activeButtonClass
              : buttonClass
          }
        >
          Numbered
        </button>

        <button
          type="button"
          onClick={addLink}
          className={
            editor.isActive("link")
              ? activeButtonClass
              : buttonClass
          }
        >
          Link
        </button>

        <label className={`${buttonClass} cursor-pointer`}>
          Add Image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                uploadImage(file);
              }

              event.target.value = "";
            }}
          />
        </label>

        <button
  type="button"
  disabled={!imageState.selected}
  onClick={() => setImageAlignment("left")}
  className={
    imageState.selected && imageState.alignment === "left"
      ? activeButtonClass
      : `${buttonClass} disabled:opacity-40`
  }
>
  Image Left
</button>

<button
  type="button"
  disabled={!imageState.selected}
  onClick={() => setImageAlignment("center")}
  className={
    imageState.selected && imageState.alignment === "center"
      ? activeButtonClass
      : `${buttonClass} disabled:opacity-40`
  }
>
  Image Centre
</button>

<button
  type="button"
  disabled={!imageState.selected}
  onClick={() => setImageAlignment("right")}
  className={
    imageState.selected && imageState.alignment === "right"
      ? activeButtonClass
      : `${buttonClass} disabled:opacity-40`
  }
>
  Image Right
</button>

        <button
          type="button"
          onClick={deleteSelectedImage}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Delete Image
        </button>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().undo().run()
            }
            disabled={!editor.can().undo()}
            className={`${buttonClass} disabled:opacity-40`}
          >
            Undo
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().redo().run()
            }
            disabled={!editor.can().redo()}
            className={`${buttonClass} disabled:opacity-40`}
          >
            Redo
          </button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}