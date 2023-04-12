"use strict";

const AWS = require("aws-sdk");
const sharp = require("sharp");
const { basename, extname } = require("path");

const S3 = new AWS.S3();

module.exports.handle = async ({ Records: records }) => {
  try {
    /*
      map -> percorre cada records de forma assícrona e retorna um record,
      porém como o records.map tem um async dentro dele, ele não vai aguardar finalizar o processo,
      portanto é preciso colocar um "await" e envolver com um "Promise.all" a função "records.map", 
      sendo assim o "await Promisse.all" vai retornar uma "Promisse", e com o "await Promisse.all" ele 
      vai esperar resolver todas essas Promisse e retorna para usuário que deu tudo certo.
    */
    await Promise.all(
      records.map(async (record) => {
        const { key } = record.s3.object;

        const image = await S3.getObject({
          Bucket: process.env.bucket,
          key: key,
        }).promise();

        const optimized = await sharp(image.Body)
          .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
          .toFormat("jpeg", { progressive: true, quality: 50 })
          .toBuffer();

        await S3.putObject({
          Body: optimized,
          Bucket: process.env.bucket,
          ContentType: "image/jpeg",
          Key: `compressed/${basename(key, extname(key))}.jpg`,
        }).promise();
      })
    );

    // caso deu tudo certo retorno para o usuário que foi criado
    return {
      statusCode: 301,
      body: { ok: true },
    };
  } catch (err) {
    return err;
  }
};
