import '@testing-library/jest-dom';
import 'whatwg-fetch';
import mockRouter from 'next-router-mock';

jest.mock('next/router', () => require('next-router-mock'));