// index.js (CommonJS - Railway ready)
const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔧 Chemin FFmpeg : Railway doit avoir ffmpeg installé en global
const ffmpegPath = 'ffmpeg';

app.post('/api/process-video', async (req, res) => {
  const eventId = req.query.eventId;
  if (!eventId) {
    return res.status(400).json({ error: 'eventId requis' });
  }

  try {
    // 📥 Récupère les vidéos liées à l'événement
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('event_id', eventId)
      .order('created_at');

    if (videosError) throw videosError;
    if (!videos || videos.length === 0) throw new Error('Aucune vidéo trouvée');

    // 📂 Création du dossier temporaire
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `event_${eventId}_`));
    const listFile = path.join(tmpDir, 'list.txt');
    const fileList = [];

    for (const v of videos) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('videos')
        .download(v.storage_path);
      if (fileErr) throw fileErr;

      const fileName = path.basename(v.storage_path);
      const filePath = path.join(tmpDir, fileName);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);
      fileList.push(`file '${filePath.replace(/'/g, "'\\''")}'`);
    }

    // 📝 Écrit le fichier list.txt pour FFmpeg
    await fs.promises.writeFile(listFile, fileList.join('\n'));
    const outputPath = path.join(tmpDir, 'final.mp4');

    // 🧪 Fusion des vidéos avec FFmpeg
    await new Promise((resolve, reject) => {
      const ff = spawn(ffmpegPath, [
        '-y', '-f', 'concat', '-safe', '0',
        '-i', listFile,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', outputPath
      ]);

      ff.stderr.on('data', (d) => console.log(`🎥 FFmpeg: ${d}`));
      ff.on('error', reject);
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
    });

    // 🚀 Upload final.mp4 dans Supabase Storage
    const buffer = await fs.promises.readFile(outputPath);
    const storagePath = `final_videos/${eventId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: 'video/mp4'
      });
    if (uploadError) throw uploadError;

    // 🔗 Récupère l'URL publique
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath);
    const finalUrl = urlData.publicUrl;

    // 🛠️ Mise à jour de l'événement avec l'URL finale
    const { error: updateError } = await supabase
      .from('events')
      .update({ final_video_url: finalUrl, status: 'done' })
      .eq('id', eventId);
    if (updateError) throw updateError;

    res.status(200).json({
      message: '🎬 Vidéo générée avec succès',
      final_video_url: finalUrl
    });
  } catch (err) {
    console.error('❌ Erreur traitement vidéo:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur le port ${port}`);
});
