import React from 'react';

import HistoryTopicGenerator from './HistoryTopicGenerator';
import HistoryOutlineGenerator from './HistoryOutlineGenerator';
import HistoryScriptGenerator from './HistoryScriptGenerator';
import HistoryImageAssetsGenerator from './HistoryImageAssetsGenerator';
import HistoryCreativesGenerator from './HistoryCreativesGenerator';

import EdutainmentTopicGenerator from './EdutainmentTopicGenerator';
import EdutainmentOutlineGenerator from './EdutainmentOutlineGenerator';
import EdutainmentScriptGenerator from './EdutainmentScriptGenerator';
import EdutainmentImageAssetsGenerator from './EdutainmentImageAssetsGenerator';
import EdutainmentCreativesGenerator from './EdutainmentCreativesGenerator';

import FactChecker from './FactChecker';
import TextSummarizer from './TextSummarizer';


export const toolComponents: { [key: string]: React.FC } = {
  // History
  'history-topic': HistoryTopicGenerator,
  'history-outline': HistoryOutlineGenerator,
  'history-script': HistoryScriptGenerator,
  'history-image-assets': HistoryImageAssetsGenerator,
  'history-creative': HistoryCreativesGenerator,

  // Edutainment
  'edutainment-topic': EdutainmentTopicGenerator,
  'edutainment-outline': EdutainmentOutlineGenerator,
  'edutainment-script': EdutainmentScriptGenerator,
  'edutainment-image-assets': EdutainmentImageAssetsGenerator,
  'edutainment-creative': EdutainmentCreativesGenerator,

  // Research
  'fact-checker': FactChecker,
  'text-summarizer': TextSummarizer,
  
};