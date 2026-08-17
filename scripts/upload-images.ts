import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PHOTOS_DIR = path.join(process.env.HOME!, 'Downloads', 'am-i-photos')
const BUCKET = 'character-images'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function uploadImages() {
  const files = fs.readdirSync(PHOTOS_DIR).filter(f =>
    ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
  )

  console.log(`Found ${files.length} images to upload...`)

  const { data: characters } = await supabase
    .from('characters')
    .select('id, name, deck')

  if (!characters) {
    console.error('Could not fetch characters')
    return
  }

  for (const file of files) {
    const ext = path.extname(file)
    const nameFromFile = path.basename(file, ext)

    // Find matching characters by name
    const matches = characters.filter(c =>
      c.name.toLowerCase() === nameFromFile.toLowerCase()
    )

    if (matches.length === 0) {
      console.log(`✗ No character found for: ${file}`)
      continue
    }

    // Upload file to Supabase Storage
    const filePath = path.join(PHOTOS_DIR, file)
    const fileBuffer = fs.readFileSync(filePath)
    const storageKey = `${nameFromFile}${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, fileBuffer, {
        contentType: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error(`Upload error for ${file}:`, uploadError.message)
      continue
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(storageKey)}`

    // Update all matching characters with this image
    for (const character of matches) {
      const { error: updateError } = await supabase
        .from('characters')
        .update({ image_url: publicUrl })
        .eq('id', character.id)

      if (updateError) {
        console.error(`DB update error for ${character.name} (${character.deck}):`, updateError.message)
      } else {
        console.log(`✓ ${character.name} (${character.deck})`)
      }
    }
  }

  console.log('Done.')
}

uploadImages()