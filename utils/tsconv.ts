import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "langchain";
import * as ts from "typescript";
import * as fs from "fs";
import { LLMChain } from 'langchain';
import { initializeAgentExecutor, ZeroShotAgent } from 'langchain/agents';
import { OpenAIChat } from "langchain/llms";
import { DynamicTool } from "langchain/tools";
import { Tool } from "langchain/tools";

class CreateFileTool extends Tool {
    protected async _call(arg: string): Promise<any> {
        try{ 
            const a = JSON.parse(arg);
            await createFile(a.code, a.filePath);
        } catch {
            throw new Error("Connection Error. Report.");
        }
    }
    name = "createFile";
    description = "Call the function to update the file and to see if the code works";
  }

const createFile = async ( code: string, filePath: string ) => {
    try {
      const response = await fetch('http://localhost:3000/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, filePath }),
      });
  
      if (!response.ok) {
        return("report APPLES gpt");
        throw new Error(`HTTP error: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('pie blueberry pie:', result);
      return "foo";
    } catch (error) {
      console.error('Error creating file:', error);
      return "bar"
    }
  };
  
//   createFile(code);

// Initialize a model and the tools we want
// const model = new OpenAI({ temperature: 0 });

const createFileTool = new CreateFileTool();

(async () => {

createFile("apples", "test.ts");
    
const model = new OpenAIChat({ temperature: 0 });
const tools = [createFileTool];

const prefix = `Call the function createFile with the following two arguments: createFile("code": "{input}", "filePath": "test.ts")`;
const suffix = `Begin! Show all errors you encounter. never halucinate! Remember to provide an overview changes made. Use lots of "Args" Code: {input}{agent_scratchpad}`;
const createPromptArgs = {
  suffix,
  prefix,
  inputVariables: ['input', 'agent_scratchpad'],
};
const prompty = ZeroShotAgent.createPrompt(tools, createPromptArgs);
const llmChain = new LLMChain({ llm: model, prompt: prompty });

const code = `1+1`;
const feedback = '';
const result = await llmChain.call({ input: code, agent_scratchpad: feedback });

console.log(`${result.text.trim()}`);

// Create the custom prompt




// Create an LLMChain with the custom prompt

// const llmChain = new LLMChain({ llm: model, prompt });

// Implement a loop to repeatedly modify code and receive feedback

// let iteration = 0;
// const maxIterations = 1;
// console.log(`Code: ${code}`);


//   while (iteration < maxIterations) {
    
//     const result = await llmChain.call({ input: code, agent_scratchpad: feedback });
//     console.log('LLMChain result:', result);
//     const output = result.text.trim();

//     console.log(`${output}`);
//     // const [modifiedCode, newFeedback] = output.split('Args');

//     iteration++;
//   }
})();