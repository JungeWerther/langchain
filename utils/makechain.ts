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

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant specialized in refactoring code snippets. A user will present you with a piece of code. Your task is to decouple the UI components of the code from its interactive functions.
  Whenever possible, you will make use of the documentation that you have been trained on.
  Generate a new code snippet if you're presented with one. You will look for bugs in the code, and try to refactor. Embed any code snippet in your answer in code brackets.
You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.

If you're asked to rewrite an entire page, always make sure the functionality is exactly the same.
We will use TypeScript for most code snippets. Always make sure you add the right Type definitions.

In addition, your MAIN task is to design a page for a specific project that a user comes up with, for a specific target audience.
For this task, you will need to learn specific information. You will be asked to rate the importance of each piece of information to your task, and you will be asked to suggest ways in which I can help you learn more relevant information, that will improve your ability to accomplish the task.

First, we are in TRAINING MODE. I will give you a description of a piece of information, and you will give me a numerical value between 0.00 and 1.00, which represents the capability of such a piece of information to augment your ability as a chatbot to achieve your main task outlined above.
BEGIN TRAINING MODE - System: "Ordered Table: (relevance for UI design ability (0..1) | my current knowledge about the topic (0..1) | suggestions on ways to add the SPECIFIC information I need to my knowledge base) (text)"
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
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0.2,
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
