import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDistributionBaseQuery,
  buildDistributionModalQuery,
  resolveDistributionModalState,
} from "@/app/admin/penyaluran/distribution-manager-state";
import {
  buildDistributionPhotoFilename,
  validateDistributionPhotoFile,
} from "@/lib/distribution-photo-upload";

test("resolveDistributionModalState prioritizes delete over edit and add", () => {
  assert.deepEqual(
    resolveDistributionModalState({
      modal: "add",
      editReportId: "rep-1",
      deleteReportId: "rep-9",
    }),
    { type: "delete", reportId: "rep-9" },
  );
});

test("resolveDistributionModalState opens edit when editReportId exists", () => {
  assert.deepEqual(
    resolveDistributionModalState({
      modal: null,
      editReportId: "rep-2",
      deleteReportId: null,
    }),
    { type: "edit", reportId: "rep-2" },
  );
});

test("resolveDistributionModalState opens add when modal=add", () => {
  assert.deepEqual(
    resolveDistributionModalState({
      modal: "add",
      editReportId: null,
      deleteReportId: null,
    }),
    { type: "add" },
  );
});

test("buildDistributionModalQuery resets page and other modal flags", () => {
  const query = new URLSearchParams(
    "page=3&editReportId=rep-1&deleteReportId=rep-2&q=hi",
  );

  assert.equal(
    buildDistributionModalQuery({ query, modal: "add" }),
    "q=hi&modal=add",
  );
  assert.equal(
    buildDistributionModalQuery({ query, modal: "edit", reportId: "rep-7" }),
    "q=hi&editReportId=rep-7",
  );
  assert.equal(
    buildDistributionModalQuery({ query, modal: "delete", reportId: "rep-8" }),
    "q=hi&deleteReportId=rep-8",
  );
});

test("buildDistributionBaseQuery clears all modal flags but keeps filters", () => {
  const query = new URLSearchParams(
    "modal=add&editReportId=rep-1&deleteReportId=rep-2&q=hi",
  );

  assert.equal(buildDistributionBaseQuery(query), "q=hi");
});

test("validateDistributionPhotoFile accepts JPG/PNG/WebP up to 1 MB", () => {
  assert.deepEqual(
    validateDistributionPhotoFile({
      name: "a.jpg",
      type: "image/jpeg",
      size: 1_048_576,
    }),
    { success: true },
  );
});

test("validateDistributionPhotoFile rejects PDF, oversize, and empty", () => {
  assert.deepEqual(
    validateDistributionPhotoFile({
      name: "a.pdf",
      type: "application/pdf",
      size: 1000,
    }),
    {
      success: false,
      error: "Format foto harus JPG, PNG, atau WebP.",
    },
  );
  assert.deepEqual(
    validateDistributionPhotoFile({
      name: "big.png",
      type: "image/png",
      size: 1_048_577,
    }),
    {
      success: false,
      error: "Ukuran foto maksimal 1 MB.",
    },
  );
  assert.deepEqual(
    validateDistributionPhotoFile({
      name: "empty.webp",
      type: "image/webp",
      size: 0,
    }),
    {
      success: false,
      error: "File foto tidak boleh kosong.",
    },
  );
});

test("buildDistributionPhotoFilename keeps safe extension and unique prefix", () => {
  assert.match(
    buildDistributionPhotoFilename({
      originalName: "Cerita Jumat.JPG",
      randomId: "xyz999",
    }),
    /^distribution-photo-xyz999\.jpg$/,
  );
});
