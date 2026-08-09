"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ResourceFileUploadProps = {
  value: string;
  onChange: (url: string) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResourceFileUpload({
  value,
  onChange,
}: ResourceFileUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Please choose a file smaller than 10 MB.");
      return;
    }

    setUploading(true);

    const oldValue = value;

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "pdf";

    const filePath =
      `downloads/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("resource-files")
      .upload(filePath, file, {
        contentType: file.type,
      });

    if (error) {
      console.error(error);
      alert("Something went wrong uploading the file.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("resource-files")
      .getPublicUrl(filePath);

    // Update the resource to use the new file
    onChange(data.publicUrl);

    // If this was replacing an existing Supabase file,
    // remove the old one from Storage.
    if (oldValue) {
      const marker =
        "/storage/v1/object/public/resource-files/";

      if (oldValue.includes(marker)) {
        const oldFilePath = decodeURIComponent(
          oldValue.split(marker)[1]
        );

        const { error: deleteError } = await supabase.storage
          .from("resource-files")
          .remove([oldFilePath]);

        if (deleteError) {
          console.error(
            "New file uploaded, but old file could not be deleted:",
            deleteError
          );
        }
      }
    }

    setUploading(false);
  }

  async function removeFile() {
    if (!value) return;

    const confirmed = window.confirm(
      "Remove this downloadable file?"
    );

    if (!confirmed) return;

    const marker =
      "/storage/v1/object/public/resource-files/";

    if (value.includes(marker)) {
      const filePath = decodeURIComponent(
        value.split(marker)[1]
      );

      const { error } = await supabase.storage
        .from("resource-files")
        .remove([filePath]);

      if (error) {
        console.error(error);
        alert("The stored file could not be deleted.");
        return;
      }
    }

    onChange("");
  }

  return (
    <div>
      <p className="mb-2 font-semibold">
        Downloadable file
      </p>

      <p className="mb-4 text-sm text-[#6b746b]">
        Upload a PDF or Word document for visitors to download.
      </p>

      {value ? (
        <div className="rounded-2xl bg-[#F5F8F5] p-5">
          <p className="font-semibold text-[#527A5A]">
            ✓ File uploaded
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#527A5A] px-5 py-2 font-semibold text-[#527A5A]"
            >
              View file
            </a>

            <label className="cursor-pointer rounded-full border border-[#527A5A] px-5 py-2 font-semibold text-[#527A5A]">
              Replace file

              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    uploadFile(file);
                  }

                  event.target.value = "";
                }}
              />
            </label>

            <button
              type="button"
              onClick={removeFile}
              className="rounded-full border border-red-200 px-5 py-2 font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="inline-block cursor-pointer rounded-full bg-[#527A5A] px-5 py-3 font-semibold text-white">
          {uploading ? "Uploading..." : "Upload file"}

          <input
            type="file"
            accept=".pdf,.docx"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                uploadFile(file);
              }

              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}