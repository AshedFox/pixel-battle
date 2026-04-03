import Handlebars from 'handlebars';
import mjml from 'mjml';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEMPLATES_DIR = path.join(__dirname, './templates');
const cache = new Map<string, HandlebarsTemplateDelegate>();

export async function renderTemplate(
  name: string,
  data: Record<string, unknown>,
): Promise<string> {
  let compiled = cache.get(name);

  if (!compiled) {
    const raw = await fs.readFile(
      path.join(TEMPLATES_DIR, `${name}.mjml.hbs`),
      'utf-8',
    );
    compiled = Handlebars.compile(raw);
    cache.set(name, compiled);
  }

  const mjmlSource = compiled(data);
  const { html, errors } = mjml(mjmlSource, { validationLevel: 'strict' });

  if (errors.length > 0) {
    throw new Error(
      `MJML errors in "${name}": ${errors.map((e) => e.formattedMessage).join(', ')}`,
    );
  }

  return html;
}
