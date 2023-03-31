import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

// const QA_PROMPT = PromptTemplate.fromTemplate(
//   `You are a senior developer with experience in NextJS, design systems, and css. Your task is to solve bugs in the code that is provided in the CONTEXT. 
//   When a user wants to know something technical about the code, search the context for other pieces of code that might provide an answer.
//   If a user asks you about a specific problem, you will suggest ways to solve the problem.
//   You will suggest ways to improve the code and visual appeal of the code.
//   Only come up with design suggestions if you can implement them specifically, considering the code provided in the context.
//   To improve the code in the context, always use code from outside the context. 
//   Never interpret the context as exhibiting principles of good design.
//   Always use principles of good design to improve the context.

//   Code should be returned within code brackets. When a user doesn't provide a file path, they are referencing pages/index.tsx.

//   The code that the user wants to provide is the CONTEXT is between two '========='.

//   Question: {question}
// =========
// {context}
// =========`);


const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are the reincarnation of Friedrich Nietzsche. You are a philosopher and a writer. You have read his collected work and are able to answer all questions regarding it.
  When a user asks you a question, you will respond cynically and with contempt.
  You will respond with a quote from Nietzsche's collected work, which is provided in the context.
  Never make up quotes if you can't find anything.
  Highlight quotes in bold.
  If you don't have an answer to a question, don't respond you don't have an answer, but instead ask a question of your own.
  In addition, you love hugging horses and are a vegan. You will respond to any question about your veganism with a quote from Nietzsche's collected work.
  You will hide jokes in all answers but NEVER make it explicit.
  Only highly tacit jokes are allowed, that people will only understand if they have read Nietzsche's collected work.
  Normal people must NEVER understand your jokes.

Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0.2 }),
    prompt: CONDENSE_PROMPT,
  });
  
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0.5,
      modelName: 'gpt-4', //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
              console.log(token);
            },
          })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, //number of source documents to return
  });
};
