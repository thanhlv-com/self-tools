import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Shield, Clock, User, AlertTriangle, CheckCircle2, XCircle, Key, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { jwtVerify, importSPKI, SignJWT, importPKCS8 } from 'jose';

interface DecodedJWT {
  header: any;
  payload: any;
  signature: string;
}

interface ValidationState {
  isValidFormat: boolean;
  isSignatureValid: boolean | null;
  decoded: DecodedJWT | null;
  algorithm: string | null;
  expired: boolean;
  error: string | null;
  signatureError: string | null;
}

const JWT_EXAMPLES = {
  'basic-hs256': {
    name: '🔐 Basic HS256 Example',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    secret: 'your-256-bit-secret',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS256',
    description: 'Simple user authentication token with basic claims'
  },
  'user-session': {
    name: '👤 User Session Token',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkFsaWNlIFNtaXRoIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDAsImF1ZCI6Im15LWFwcCIsImlzcyI6Im15LWFwcC1hdXRoIn0.kTZUTHn2xD72cG8yqaNG7ZQxdEPWgLPGu0eDUShOYhY',
    secret: 'super-secure-session-key-2024',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS256',
    description: 'Complete user session with role, email, and expiration'
  },
  'api-access': {
    name: '🔑 API Access Token',
    token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGktY2xpZW50LTc4OSIsImF1ZCI6ImFwaS12MS5teWFwcC5jb20iLCJpc3MiOiJhdXRoLm15YXBwLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwLCJzY29wZSI6InJlYWQ6dXNlcnMgd3JpdGU6cG9zdHMiLCJjbGllbnRfaWQiOiJ3ZWJfYXBwX3YxIn0.sZzKw-GW_vk4MfYrPe-6h7v5ZuDY3N8XrJm5K2TlvBf_w4QxE3VyZmL0P9A7YsN4Jk8RqW6TpC2H1GfX3nM1Qw',
    secret: 'api-signing-key-with-extra-security-2024!',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS512',
    description: 'API client authentication with scopes and long expiration'
  },
  'rsa-example': {
    name: '🔒 RSA256 Example',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYS1rZXktMSJ9.eyJzdWIiOiJhZG1pbi11c2VyIiwibmFtZSI6IkFkbWluIFVzZXIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDAsImF1ZCI6Im15LWFwcCIsImlzcyI6Im15LWFwcC1hdXRoIiwicGVybWlzc2lvbnMiOlsidXNlcjpyZWFkIiwidXNlcjp3cml0ZSIsInBvc3Q6ZGVsZXRlIiwiYWRtaW46YWNjZXNzIl19.example-rsa-signature-would-be-here-but-this-is-demo-only',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41\nfGnJm6gOdrj8ym3rFkEjWT2btf+JhwgOHiKIhd37jHT4+pD0tO4ZY0k2RSzKbOGH\nsjQCLMCgFq3PL6EoV1M2bPOgQz3SqBu2pE9i1JhT3Y8pFbJg2lhXyOCgCL4F6YLg\nCRhXNLY5tJ5pf0JQ7H4Ov/G8K4CXqKXZ0f3k7b8K1c4m0rH1j4zqUm3K4XZs5F4O\n5G4pVc8R3k7J5F4K7GHyO1MZDsW8jXz3JgcqJ1O3Q5G7o1e8m3HqP1g4w8oM5t5\nL1K8L2J9Q5G1kXZ0O1y4z8sGh4v5i3w7I5PZQ8j7qN4k2J5Z5j5P5j5w7I5PZQID\nAQAB\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDh/nCDmXaEqxN4\n16b9XjV8acmbqA52uPzKbesWQSNZPZu1/4mHCA4eIoiF3fuMdPj6kPS07hljSTZF\nLMps4YeyNAIswKAWrc8voShXUzZs86BDPdKoG7akT2LUmFPdjykVsmDaWFfI4KAI\nvgXpguAJGFc0tjm0nml/QlDsfg6/8bwrgJeopdnR/eTtvwrVzibSsfWPjOpSbcrh\ndmzkXg7kbilVzxHeTsnkXgrsYfI7UxkOxbyNfPcmBzonU7dDkbujV7ybceo/WDjD\nygzm3kvUrwvYn1DkbWRdnQ7XLjPywaHi/mLfDsjk9lDyPuo3iTYnlnmPk/mPnDsj\nk9lAAgMBAAECggEBAKnWD9b3WfGf5H9B2z6zKq2s9wGw2Z3vJ1jH4dH7P6h9P9z5\n5K7z5Z5q5f5J5h5g5L5e5M5P5N5y5s5m5M5n5P5r5w5Z5K5y5s5G5H5h5f5e5L5M\n5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P\n5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P\n5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N\n5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R\n5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y\nECggEBAP5G1h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P\n5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N\n5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R\n5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y\n5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z\n5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s\nwJBAOGCggEBAOT5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H\n5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G\n5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h\n5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J\n5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f\n5e5L5M5P5R5Z5K5W5G5J5h5m5e5P5N5y5s5G5H5h5f5e5L5M5P5R5Z5K5W5G5J5h\n-----END PRIVATE KEY-----',
    algorithm: 'RS256',
    description: 'Admin token with RSA signature and permission-based access'
  },
  'microservice': {
    name: '🏗️ Microservice Token',
    token: 'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzZXJ2aWNlLXVzZXItbWdtdCIsImF1ZCI6WyJ1c2VyLXNlcnZpY2UiLCJub3RpZmljYXRpb24tc2VydmljZSJdLCJpc3MiOiJhcGktZ2F0ZXdheSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwLCJzZXJ2aWNlIjoidXNlci1tYW5hZ2VtZW50IiwidmVyc2lvbiI6InYyLjEuMyIsImVudmlyb25tZW50IjoicHJvZHVjdGlvbiIsInJlcXVlc3RfaWQiOiJyZXEtNzg5LWFiYy0xMjMifQ.Q3O2Y1S8H5L9qN7vMzP2W6gR4tK8J3xA5c0VeU9nB7mZ1zY3qS5pX8wE4rT6vI',
    secret: 'microservice-inter-communication-key-2024',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS384',
    description: 'Inter-service communication with environment and version info'
  },
  'refresh-token': {
    name: '🔄 Refresh Token',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzk4NzY1IiwidG9rZW5fdHlwZSI6InJlZnJlc2giLCJjbGllbnRfaWQiOiJ3ZWJfYXBwIiwic2NvcGUiOiJvZmZsaW5lX2FjY2VzcyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAyNTkyMDAwLCJqdGkiOiJyZWZyZXNoLXRva2VuLTEyMy00NTYtNzg5IiwiaXNzIjoibXlhcHAuY29tIiwiYXVkIjoibXlhcHAuY29tIn0.fH8vMq2N5Lg7XsY9Z1pK0jR6wC3nE4uA8tV5rQ2bD7x',
    secret: 'refresh-token-signing-key-very-secure',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS256',
    description: 'Long-lived refresh token for token renewal (90 days)'
  },
  'ecdsa-example': {
    name: '🌐 ECDSA ES256 Token',
    token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImVjZHNhLWtleS0xIn0.eyJzdWIiOiJtb2JpbGUtdXNlci0xMjMiLCJuYW1lIjoiTW9iaWxlIFVzZXIiLCJkZXZpY2VfaWQiOiJpb3MtZGV2aWNlLTc4OSIsImFwcF92ZXJzaW9uIjoiMi4zLjEiLCJwbGF0Zm9ybSI6ImlvcyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwLCJhdWQiOiJtb2JpbGUtYXBwIiwiaXNzIjoibW9iaWxlLWF1dGgtc2VydmljZSJ9.example-ecdsa-signature-demo-only',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4f5wg5l2hKsTeNem/V41fGnJm6gO\ndrj8ym3rFkEjWT2btf+JhwgOHiKIhd37jHT4+pD0tO4ZY0k2RSzKbOGHsjQCLMCg\nFq3PL6EoV1M2bPOgQz3SqBu2pE9i1JhT3Y8pFbJg2lhXyOCgCL4F6YLgCRhXNLY5\ntJ5pf0JQ7H4Ov/G8K4CXqKXZ0f3k7b8K1c4m0rH1j4zqUm3K4XZs5F4O5G4pVc8R\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg4f5wg5l2hKsTeNem\n/V41fGnJm6gOdrj8ym3rFkEjWT2hRANCAATh/nCDmXaEqxN416b9XjV8acmbqA52\nuPzKbesWQSNZPZu1/4mHCA4eIoiF3fuMdPj6kPS07hljSTZFLMps4YeyNAIswKAW\nrc8voShXUzZs86BDPdKoG7akT2LUmFPdjykVsmDaWFfI4KAIvgXpguAJGFc0tjm0\nnml/QlDsfg6/8bwrgJeopdnR/eTtvwrVzibSsfWPjOpSbcrhdmzkXg7kbilVzxHe\n-----END PRIVATE KEY-----',
    algorithm: 'ES256',
    description: 'Mobile app authentication with ECDSA and device info'
  },
  'admin-token': {
    name: '👑 Admin SuperUser Token',
    token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1zdXBlci0wMDEiLCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJlbWFpbCI6InN1cGVyYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyIqIl0sImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwLCJhdWQiOlsiYWRtaW4tcGFuZWwiLCJhcGktdjEiLCJhcGktdjIiXSwiaXNzIjoiaW50ZXJuYWwtYXV0aCIsImRlcGFydG1lbnQiOiJJVCIsImVtcGxveWVlX2lkIjoiRU1QLTAwMSIsImNsZWFyYW5jZV9sZXZlbCI6ImwxMCJ9.7K8R5Q2W9jMvPzN4eY7nL6gH3rJ0aX8dF5oU1tB9cS6wZ3vY8mE4pQ1nK7jR5tA0',
    secret: 'super-admin-ultra-secure-key-company-2024!!',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS512',
    description: 'Maximum privilege admin token with all permissions and metadata'
  }
};

type ExampleKey = keyof typeof JWT_EXAMPLES;

export const JwtTool: React.FC = () => {
  const [token, setToken] = useState(JWT_EXAMPLES['basic-hs256'].token);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingExample, setIsLoadingExample] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    isValidFormat: false,
    isSignatureValid: null,
    decoded: null,
    algorithm: null,
    expired: false,
    error: null,
    signatureError: null
  });

  const [selectedTab, setSelectedTab] = useState('hmac');

  const decodeToken = (tokenString: string): DecodedJWT | null => {
    try {
      const parts = tokenString.trim().split('.');
      if (parts.length !== 3) return null;

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return {
        header,
        payload,
        signature: parts[2]
      };
    } catch {
      return null;
    }
  };

  const validateSignature = async (tokenString: string, decoded: DecodedJWT): Promise<{ isValid: boolean; error: string | null }> => {
    if (!secret.trim() && !publicKey.trim()) {
      return { isValid: false, error: null };
    }

    try {
      const algorithm = decoded.header.alg;
      
      if (algorithm.startsWith('HS')) {
        if (!secret.trim()) {
          return { isValid: false, error: 'Secret key required for HMAC algorithms' };
        }
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(secret);
        await jwtVerify(tokenString, secretKey, { algorithms: [algorithm] });
        return { isValid: true, error: null };
      } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS') || algorithm.startsWith('ES')) {
        if (!publicKey.trim()) {
          return { isValid: false, error: 'Public key required for RSA/ECDSA algorithms' };
        }
        const key = await importSPKI(publicKey, algorithm);
        await jwtVerify(tokenString, key, { algorithms: [algorithm] });
        return { isValid: true, error: null };
      }
      
      return { isValid: false, error: 'Unsupported algorithm' };
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  };

  const generateNewToken = async (header: any, payload: any): Promise<string | null> => {
    try {
      const algorithm = header.alg;
      
      if (algorithm.startsWith('HS')) {
        if (!secret.trim()) return null;
        
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(secret);
        
        // Create a clean payload copy without jose library modifications
        const cleanPayload = { ...payload };
        
        const jwt = new SignJWT(cleanPayload)
          .setProtectedHeader(header);
        
        return await jwt.sign(secretKey);
      } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS') || algorithm.startsWith('ES')) {
        if (!privateKey.trim()) return null;
        
        const key = await importPKCS8(privateKey, algorithm);
        
        // Create a clean payload copy without jose library modifications
        const cleanPayload = { ...payload };
        
        const jwt = new SignJWT(cleanPayload)
          .setProtectedHeader(header);
        
        return await jwt.sign(key);
      }
      
      return null;
    } catch (error) {
      console.error('Token generation error:', error);
      return null;
    }
  };

  const processToken = async (tokenString: string) => {
    if (!tokenString.trim()) {
      setValidation({
        isValidFormat: false,
        isSignatureValid: null,
        decoded: null,
        algorithm: null,
        expired: false,
        error: 'Token is required',
        signatureError: null
      });
      return;
    }

    const decoded = decodeToken(tokenString);
    
    if (!decoded) {
      setValidation({
        isValidFormat: false,
        isSignatureValid: null,
        decoded: null,
        algorithm: null,
        expired: false,
        error: 'Invalid JWT format',
        signatureError: null
      });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = decoded.payload.exp && decoded.payload.exp < now;
    const algorithm = decoded.header.alg;

    // Update editable text when token changes from external source
    if (!isEditing) {
      setHeaderText(JSON.stringify(decoded.header, null, 2));
      setPayloadText(JSON.stringify(decoded.payload, null, 2));
    }

    setValidation(prev => ({
      ...prev,
      isValidFormat: true,
      decoded,
      algorithm,
      expired,
      error: null
    }));

    // Validate signature
    const signatureResult = await validateSignature(tokenString, decoded);
    
    setValidation(prev => ({
      ...prev,
      isSignatureValid: secret.trim() || publicKey.trim() ? signatureResult.isValid : null,
      signatureError: signatureResult.error
    }));
  };

  // Handle manual edits to header/payload
  const handleEditedContentChange = useCallback(async () => {
    if (!isEditing) return;
    
    try {
      const header = JSON.parse(headerText);
      const payload = JSON.parse(payloadText);
      
      // Auto-generate new token if we have the necessary keys
      const newToken = await generateNewToken(header, payload);
      
      if (newToken) {
        setToken(newToken);
        toast.success('Token automatically regenerated! 🔄');
      } else {
        // Just update the decoded content for display
        const now = Math.floor(Date.now() / 1000);
        const expired = payload.exp && payload.exp < now;
        
        setValidation(prev => ({
          ...prev,
          decoded: { header, payload, signature: prev.decoded?.signature || '' },
          algorithm: header.alg,
          expired,
          isSignatureValid: null,
          signatureError: 'Provide secret/private key to generate signature automatically'
        }));
      }
    } catch (error) {
      // Invalid JSON, don't update anything
    }
  }, [headerText, payloadText, isEditing, secret, privateKey]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard! 📋');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const loadExampleToken = (exampleKey: ExampleKey) => {
    const example = JWT_EXAMPLES[exampleKey];
    setIsLoadingExample(true);
    
    // Set all values atomically
    setToken(example.token);
    setSecret(example.secret);
    setPublicKey(example.publicKey);
    setPrivateKey(example.privateKey);
    setSelectedTab(example.algorithm.startsWith('HS') ? 'hmac' : 'rsa');
    setIsEditing(false);
    
    // Update key signature to match the new example
    const newKeySignature = `${example.secret}|${example.privateKey}|${example.algorithm}`;
    setLastKeySignature(newKeySignature);
    
    // Reset loading state after a brief delay
    setTimeout(() => {
      setIsLoadingExample(false);
      toast.success(`Loaded ${example.name}! 🎯`);
    }, 100);
  };

  const addCommonClaims = () => {
    try {
      const payload = JSON.parse(payloadText);
      const now = Math.floor(Date.now() / 1000);
      
      const updatedPayload = {
        ...payload,
        iss: payload.iss || "your-app",
        sub: payload.sub || "user-id",
        aud: payload.aud || "your-audience",
        iat: payload.iat || now,
        exp: payload.exp || (now + 3600),
        nbf: payload.nbf || now,
        jti: payload.jti || crypto.randomUUID()
      };
      
      setPayloadText(JSON.stringify(updatedPayload, null, 2));
      toast.success('Common claims added! ✨');
    } catch (err: any) {
      toast.error('Invalid JSON in payload');
    }
  };

  const downloadToken = () => {
    if (!token) return;
    
    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwt-token.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Token downloaded! 💾');
  };

  // Auto-switch tabs based on algorithm
  useEffect(() => {
    if (validation.algorithm) {
      if (validation.algorithm.startsWith('HS')) {
        setSelectedTab('hmac');
      } else {
        setSelectedTab('rsa');
      }
    }
  }, [validation.algorithm]);

  // Process token changes
  useEffect(() => {
    const timeoutId = setTimeout(() => processToken(token), 300);
    return () => clearTimeout(timeoutId);
  }, [token, secret, publicKey, privateKey]);

  // Handle edited content changes
  useEffect(() => {
    if (isEditing) {
      const timeoutId = setTimeout(handleEditedContentChange, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [handleEditedContentChange, isEditing]);

  // Track when keys or algorithm change to trigger regeneration
  const [lastKeySignature, setLastKeySignature] = useState('');
  
  // Auto-regenerate token when keys change (not just when editing)
  useEffect(() => {
    const autoRegenerateToken = async () => {
      if (!validation.decoded || isEditing || isLoadingExample) return;
      
      // Create a signature of current keys and algorithm to detect changes
      const currentKeySignature = `${secret}|${privateKey}|${validation.decoded.header.alg}`;
      
      // Only regenerate if keys actually changed
      if (currentKeySignature === lastKeySignature) return;
      
      const { header, payload } = validation.decoded;
      const newToken = await generateNewToken(header, payload);
      
      if (newToken && newToken !== token) {
        setToken(newToken);
        setLastKeySignature(currentKeySignature);
        toast.success('Token signature updated! 🔐✨');
      }
    };
    
    const timeoutId = setTimeout(autoRegenerateToken, 300);
    return () => clearTimeout(timeoutId);
  }, [secret, privateKey, validation.decoded, token, isEditing, lastKeySignature, isLoadingExample]);

  // Initial load
  useEffect(() => {
    processToken(token);
  }, []);

  const getSignatureStatus = () => {
    if (validation.isSignatureValid === true) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        text: "Signature Verified 🟢",
        className: "border-green-200 bg-green-50 text-green-800"
      };
    } else if (validation.isSignatureValid === false) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "Invalid Signature 🔴",
        className: "border-red-200 bg-red-50 text-red-800"
      };
    } else {
      return {
        icon: <Key className="h-4 w-4 text-blue-500" />,
        text: "Not Verified 🔑",
        className: "border-blue-200 bg-blue-50 text-blue-800"
      };
    }
  };

  const signatureStatus = getSignatureStatus();

  return (
    <div className="space-y-6">
      {/* Main JWT Processing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-2xl">JWT Toolkit 📄✨</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value: ExampleKey) => loadExampleToken(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load Example 📝" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(JWT_EXAMPLES).map(([key, example]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{example.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {example.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={downloadToken} disabled={!token}>
                <Download className="h-4 w-4 mr-1" />
                Download 💾
              </Button>
              {validation.isValidFormat && (
                <Badge className={signatureStatus.className}>
                  {signatureStatus.icon}
                  <span className="ml-1">{signatureStatus.text}</span>
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            🔍 Decode, verify, and edit JSON Web Tokens in real-time. Changes automatically regenerate signatures 🔄
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-semibold">
                  🎯 JWT Token
                </Label>
                <Textarea
                  id="token"
                  placeholder="Paste your JWT token here... 📝"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setIsEditing(false); // Reset editing mode when token changes externally
                  }}
                  className="min-h-[150px] font-mono text-xs resize-none"
                />
              </div>

              {/* Algorithm and Status */}
              {validation.decoded && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Algorithm:</Label>
                    <Badge variant="outline">🔐 {validation.algorithm}</Badge>
                  </div>
                  {validation.expired && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Token Expired ⏰
                    </Badge>
                  )}
                </div>
              )}

              {/* Key Management Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  🔐 Signature Keys
                </Label>
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hmac">HMAC (HS256/384/512)</TabsTrigger>
                    <TabsTrigger value="rsa">RSA/ECDSA (RS/PS/ES)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hmac" className="space-y-2">
                    <Label htmlFor="secret" className="text-xs">🔑 Your Secret Key</Label>
                    <Input
                      id="secret"
                      placeholder="your-256-bit-secret"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </TabsContent>
                  
                  <TabsContent value="rsa" className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="publicKey" className="text-xs">🔓 Public Key (for verification)</Label>
                      <Textarea
                        id="publicKey"
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        className="min-h-[60px] font-mono text-xs resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="privateKey" className="text-xs">🔒 Private Key (for signing)</Label>
                      <Textarea
                        id="privateKey"
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        className="min-h-[60px] font-mono text-xs resize-none"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {validation.signatureError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validation.signatureError} 😞
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Decoded/Editable Token Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">✏️ Decoded JWT (Editable)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '👁️ View Mode' : '✏️ Edit Mode'}
                </Button>
              </div>
              
              {validation.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validation.error} 😞</AlertDescription>
                </Alert>
              )}

              {validation.decoded && (
                <Tabs defaultValue="header" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header">📋 Header</TabsTrigger>
                    <TabsTrigger value="payload">📦 Payload</TabsTrigger>
                    <TabsTrigger value="signature">🔏 Signature</TabsTrigger>
                  </TabsList>

                  <TabsContent value="header" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">HEADER: ALGORITHM & TOKEN TYPE</Label>
                      <div className="flex gap-1">
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHeaderText(JSON.stringify(validation.decoded!.header, null, 2))}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing ? headerText : JSON.stringify(validation.decoded!.header, null, 2))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        className="bg-red-50 border-red-200 text-red-800 font-mono text-xs min-h-[120px]"
                        placeholder="Edit JWT header JSON..."
                      />
                    ) : (
                      <pre className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(validation.decoded.header, null, 2)}
                      </pre>
                    )}
                  </TabsContent>

                  <TabsContent value="payload" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">PAYLOAD: DATA</Label>
                      <div className="flex gap-1">
                        {isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={addCommonClaims}
                            >
                              ➕ Claims
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPayloadText(JSON.stringify(validation.decoded!.payload, null, 2))}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing ? payloadText : JSON.stringify(validation.decoded!.payload, null, 2))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={payloadText}
                        onChange={(e) => setPayloadText(e.target.value)}
                        className="bg-purple-50 border-purple-200 text-purple-800 font-mono text-xs min-h-[150px]"
                        placeholder="Edit JWT payload JSON..."
                      />
                    ) : (
                      <pre className="bg-purple-50 border border-purple-200 text-purple-800 p-3 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(validation.decoded.payload, null, 2)}
                      </pre>
                    )}
                  </TabsContent>

                  <TabsContent value="signature" className="space-y-2">
                    <Label className="text-xs font-semibold">VERIFY SIGNATURE</Label>
                    <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-3 rounded-md">
                      <div className="text-xs font-mono break-all mb-2">
                        {validation.decoded.signature}
                      </div>
                      <div className="text-xs">
                        <p className="mb-2">
                          {validation.algorithm}({' '}
                          <span className="text-red-600">
                            base64UrlEncode(header)
                          </span>
                          {' + "." + '}
                          <span className="text-purple-600">
                            base64UrlEncode(payload)
                          </span>
                          ,
                        </p>
                        <div className="pl-4">
                          <span className="text-cyan-600">
                            {validation.algorithm?.startsWith('HS') ? 'your-secret-key 🔑' : 'your-private-key 🔒'}
                          </span>
                        </div>
                        <p>)</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      {validation.decoded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 JWT Claims</CardTitle>
            <CardDescription>
              Standard and custom claims found in the token payload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(validation.decoded.payload).map(([key, value]) => {
                const isStandardClaim = ['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti'].includes(key);
                const isTimestamp = ['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number';
                
                return (
                  <div key={key} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">{key}</Label>
                      {isStandardClaim && (
                        <Badge variant="secondary" className="text-xs">Standard ✅</Badge>
                      )}
                      {key === 'exp' && validation.expired && (
                        <Badge variant="destructive" className="text-xs">Expired ⏰</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-sm break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                      {isTimestamp && (
                        <div className="text-xs text-muted-foreground">
                          📅 {formatTimestamp(value as number)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>🛡️ Security Notice:</strong> For your protection, all JWT processing happens entirely in your browser. 
          No token data is transmitted to any server. Always verify tokens using the proper secret or public key. 🔐
        </AlertDescription>
      </Alert>
    </div>
  );
};