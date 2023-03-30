import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import { exec, ExecException } from 'child_process';
import path from 'path';

interface CreateFileRequestBody {
  codeSnippet: string;
  filePath: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Parse the request body
    const { codeSnippet, filePath } = req.body as CreateFileRequestBody;

    // Validate the file path to prevent path traversal attacks
    if (filePath.includes('..')) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    // Prepend the 'pages/sandbox/' directory path to the file path
    const restrictedFilePath = path.join('pages', 'sandbox', filePath);

    // Create the file and write the code snippet to it
    await fs.writeFile(restrictedFilePath, codeSnippet);

    // Run a command to recompile the project and capture the output
    exec('npm run dev', (error: ExecException | null, stdout: string, stderr: string) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      if (stderr) {
        res.status(500).json({ error: stderr });
        return;
      }

      // Return the output as the API response
      res.status(200).json({ log: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}