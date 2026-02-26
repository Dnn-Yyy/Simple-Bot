import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import fetch from "node-fetch";
import crypto from "crypto";
import { FormData as NodeFormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from 'file-type';

export async function uploaderMaelyn(fileBuffer) {
    const URL = 'https://cdn.maelyn.tech/api/upload';
    const formData = new FormData();
    formData.append('file', fileBuffer, 'upload.jpg');

    try {
        const response = await axios.post(URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Layanan upload Maelyn gagal: ${error.response?.data?.message || error.message}`);
    }
}

export async function uploaderCatbox(content) {
  const { ext, mime } = await fileTypeFromBuffer(content) || {};  
  const blob = new Blob([content], { type: mime });
  const formData = new NodeFormData();
  const randomBytes = crypto.randomBytes(5).toString("hex");
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", blob, randomBytes + "." + ext);

  try {
    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
      },
    });
    return await response.text();
  } catch (error) {
    throw new Error(`File upload to Catbox failed: ${error.message}`);
  }
}