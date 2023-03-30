import { useState } from 'react';

interface CreateFileRequestBody {
  codeSnippet: string;
  filePath: string;
}

const Windex = () => {
  const [codeSnippet, setCodeSnippet] = useState('');
  const [filePath, setFilePath] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codeSnippet, filePath })
    });
    const data = await response.json();
    console.log(data);
    location.reload();
  };

  return (
    <div>
      <textarea value={codeSnippet} onChange={e => setCodeSnippet(e.target.value)} />
      <input type="text" value={filePath} onChange={e => setFilePath(e.target.value)} />
      <button onClick={handleSubmit}>Create File</button>
    </div>
  );
};

export default Windex;
