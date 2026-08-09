"use client";

import { supabase } from "@/lib/supabase";

type FeaturedImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function FeaturedImageUpload({
  value,
  onChange,
}: FeaturedImageUploadProps) {
  async function uploadFeaturedImage(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Please upload a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Please choose an image smaller than 5 MB.");
      return;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `featured/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("article-images")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert("Something went wrong uploading the image.");
      return;
    }

    const { data } = supabase.storage
      .from("article-images")
      .getPublicUrl(filePath);

    onChange(data.publicUrl);
  }

  async function removeFeaturedImage() {
    if (!value) return;

    const confirmed = window.confirm(
      "Remove this featured image?"
    );

    if (!confirmed) return;

    const marker =
      "/storage/v1/object/public/article-images/";

    if (value.includes(marker)) {
      const filePath = decodeURIComponent(
        value.split(marker)[1]
      );

      const { error } = await supabase.storage
        .from("article-images")
        .remove([filePath]);

      if (error) {
        console.error(error);
      }
    }

    onChange("");
  }

  return (
    <div>
      <p className="mb-2 font-semibold">Featured image</p>

      <p className="mb-4 text-sm text-[#6b746b]">
        This image will appear on the Advice page and at the top
        of the article.
      </p>

      {value ? (
        <div>
          <img
            src={value}
            alt="Article featured image preview"
            className="max-h-80 w-full rounded-2xl object-cover"
          />

          <div className="mt-4 flex gap-3">
            <label className="cursor-pointer rounded-full border border-[#527A5A] px-5 py-2 font-semibold text-[#527A5A]">
              Replace image

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    uploadFeaturedImage(file);
                  }

                  event.target.value = "";
                }}
              />
            </label>

            <button
              type="button"
              onClick={removeFeaturedImage}
              className="rounded-full border border-red-200 px-5 py-2 font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="inline-block cursor-pointer rounded-full bg-[#527A5A] px-5 py-3 font-semibold text-white">
          Upload featured image

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                uploadFeaturedImage(file);
              }

              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}