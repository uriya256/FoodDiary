package com.uriya.fooddiary

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.googlecode.tesseract.android.TessBaseAPI
import java.io.File

/** Offline text recognition (Tesseract, Hebrew + English). Works best with clear block letters. */
object Ocr {

    private val LANGS = listOf("heb", "eng")

    /** Copies the bundled language files to app storage once; returns the folder Tesseract needs. */
    private fun dataDir(ctx: Context): String? {
        val base = File(ctx.filesDir, "tesseract")
        val dir = File(base, "tessdata")
        dir.mkdirs()
        for (lang in LANGS) {
            val out = File(dir, "$lang.traineddata")
            if (out.exists() && out.length() > 1000) continue
            try {
                ctx.assets.open("tessdata/$lang.traineddata").use { input ->
                    out.outputStream().use { input.copyTo(it) }
                }
            } catch (_: Exception) {
                out.delete()
                return null
            }
        }
        return base.absolutePath
    }

    /** Loads the picture upright and not larger than [maxSide]. */
    fun loadBitmap(ctx: Context, uri: Uri, maxSide: Int = 2400): Bitmap? {
        val cr = ctx.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0) return null
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= maxSide || bounds.outHeight / (sample * 2) >= maxSide) sample *= 2
        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        var bmp = cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) } ?: return null

        val rotation = try {
            cr.openInputStream(uri)?.use {
                when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            } ?: 0f
        } catch (_: Exception) { 0f }
        if (rotation != 0f) {
            val m = Matrix().apply { postRotate(rotation) }
            bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
        }
        return bmp
    }

    /** Grayscale with a little extra contrast: helps pencil and pale ink. */
    private fun prepare(src: Bitmap): Bitmap {
        val out = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
        val c = Canvas(out)
        val gray = ColorMatrix().apply { setSaturation(0f) }
        val contrast = 1.35f
        val t = (-0.5f * contrast + 0.5f) * 255f
        gray.postConcat(ColorMatrix(floatArrayOf(
            contrast, 0f, 0f, 0f, t,
            0f, contrast, 0f, 0f, t,
            0f, 0f, contrast, 0f, t,
            0f, 0f, 0f, 1f, 0f
        )))
        c.drawBitmap(src, 0f, 0f, Paint().apply { colorFilter = ColorMatrixColorFilter(gray) })
        return out
    }

    /** Returns the recognized text, or null when the language files are missing. */
    fun recognize(ctx: Context, bmp: Bitmap): String? {
        val path = dataDir(ctx) ?: return null
        val tess = TessBaseAPI()
        return try {
            if (!tess.init(path, LANGS.joinToString("+"))) return null
            tess.setPageSegMode(TessBaseAPI.PageSegMode.PSM_AUTO)
            tess.setImage(prepare(bmp))
            tess.getUTF8Text() ?: ""
        } finally {
            tess.recycle()
        }
    }
}
