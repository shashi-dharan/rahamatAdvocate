import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import blogPost from './schemas/blogPost'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in sanity/.env before starting Studio.')
}

export default defineConfig({
  name: 'default',
  title: 'Rahmat Advocate',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: [blogPost] },
})