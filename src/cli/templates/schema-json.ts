export type SchemaFieldType = 'string' | 'integer' | 'number' | 'boolean';

export interface SchemaFieldAnswer {
  name: string;
  type: SchemaFieldType;
  description: string;
}

export interface SchemaAnswers {
  name: string;
  description: string;
  fields: [SchemaFieldAnswer, ...SchemaFieldAnswer[]];
}

export function buildSchemaJson(answers: SchemaAnswers): string {
  const properties: Record<string, { type: SchemaFieldType; description: string }> = {};
  for (const field of answers.fields) {
    properties[field.name] = { type: field.type, description: field.description };
  }

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: titleCase(answers.name),
    description: answers.description,
    type: 'object',
    properties,
  };

  return `${JSON.stringify(schema, null, 2)}\n`;
}

function titleCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(' ');
}
