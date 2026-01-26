const { Router } = require("express");
const TranscripcionModel = require("../../models/transcripcion.model");

const router = Router();
const model = new TranscripcionModel();

router.get("/transcripciones/:idLlamada", async (req, res) => {
  try {
    const { idLlamada } = req.params;
    const transcripciones = await model.getAll(idLlamada);

    return res.status(200).json({ data: transcripciones });
  } catch (err) {
    return res.status(500).json({ msg: `Error al obtener transcripciones. ${err}` })
  }
});

router.post("/transcripcion", async (req, res) => {
  try {
    const { idLlamada, speaker, texto } = req.body;
    const id = await model.createTranscripcion({ idLlamada, speaker, texto });

    return res.status(200).json({ msg: "Transcripcion guardada exitosamente", data: { id } });
  } catch (err) {
    return res.status(500).json({ msg: `Error al guardar transcripcion. ${err}` })
  }
});


module.exports = router;