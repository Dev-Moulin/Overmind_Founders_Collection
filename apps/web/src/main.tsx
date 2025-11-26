import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import App from './App';
import { apolloClient } from './lib/apollo-client';
import './i18n'; // Initialize i18n
import './style.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
