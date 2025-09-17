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
  'hs256': {
    name: '🔐 HS256 (HMAC SHA-256)',
    secret: 'your-256-bit-secret',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS256',
    description: 'Symmetric key algorithm using SHA-256'
  },
  'hs384': {
    name: '🔐 HS384 (HMAC SHA-384)',
    secret: 'your-384-bit-secret-key-for-stronger-security',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS384',
    description: 'Symmetric key algorithm using SHA-384'
  },
  'hs512': {
    name: '🔐 HS512 (HMAC SHA-512)',
    secret: 'your-512-bit-secret-key-for-maximum-security-2024',
    publicKey: '',
    privateKey: '',
    algorithm: 'HS512',
    description: 'Symmetric key algorithm using SHA-512'
  },
  'rs256': {
    name: '🔒 RS256 (RSA SHA-256)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwJb5A9e4k4x2L8WcfX0e\nQw8V6y9B8K7L6e4rI9p3o2m1f8s7u4v5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1\nM2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3\ns4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5\nY6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5C6D7\nE8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7i8j9\nQIDAQAB\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAluUD17iTjHYv\nxZx9fR5DDxXrL0Hwrsvp7isj2nejabV/yzu7i/nDrHvLzP0DQHULYPcThfZnh8n5\nK0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1\nq2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3\nW4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5\nC6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7\ni8j9QIDAQABAgEBALtm8F5l3G6N2P8a9k4v1x7w2y9D3K8E4h6L2b9N7S1d5H8r\nV3c9k5P7m6z2j9T4F8w3q1L5y2N8o6t4e9u0a7i3B6c8D1F2G5h7J9k3L6M8n0P2\nQ5r7s9T1u4V6w8X0y2Z4a6B8c0D2e4F6g8H0i2J4k6L8m0n2O4p6Q8r0S2t4U6v8\nW0x2Y4z6A8b0C2d4E6f8G0h2I4j6K8l0M2n4o6P8q0R2s4T6u8V0w2X4y6Z8a0b2\nC4d6e8F0g2H4i6j8K0l2M4n6o8P0q2R4s6t8U0v2W4x6y8Z0a2b4C6d8e0F2g4H6\ni8j0K2l4M6n8o0P2QAoGBAOdT8y7L2v5n3K9g1F6j4E8m0a7z5P2w9R3s6V4y8B1\nC2D5e7G0h3I6j9K2l5M8n1o4P7q0r3S6t9u2V5w8X1y4Z7a0b3C6d9e2F5g8H1i4\nJ7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3G6h9I2j5K8l1M4n7o0\nP3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5O8p1q4R7s0T3u6\nV9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1u4V7w0X3y6Z9a2\nAoGBAOQ6v3f0G4T8k1B7u2e5y8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9H2k5\nn8Q1t4w7z0C3f6I9l2o5R8u1x4A7d0g3J6m9p2s5V8y1B4e7h0K3n6q9T2w5z8C1\nf4I7l0o3R6u9x2A5d8g1J4m7p0s3V6y9B2e5h8K1n4q7T0w3z6C9f2I5l8o1r4U7\nx0A3d6g9J2m5p8s1V4y7B0e3h6K9n2q5T8w1z4C7f0I3l6o9r2U5x8A1d4g7J0m3\np6s9V2y5B8e1h4K7n0q3T6w9z2C5f8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9\nAoGBAMG9j3k6n0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5\nO8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1\nu4V7w0X3y6Z9a2b5C8d1e4F7g0H3i6J9k2L5m8n1O4p7Q0r3s6T9u2V5w8X1y4Z7\na0b3C6d9e2F5g8H1i4J7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3\nG6h9I2j5K8l1M4n7o0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9\nM2n5O8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5\ns8T1u4V7w0X3y6Z9a2\n-----END PRIVATE KEY-----',
    algorithm: 'RS256',
    description: 'RSA signature with SHA-256 (asymmetric)'
  },
  'rs384': {
    name: '🔒 RS384 (RSA SHA-384)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwJb5A9e4k4x2L8WcfX0e\nQw8V6y9B8K7L6e4rI9p3o2m1f8s7u4v5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1\nM2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3\ns4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5\nY6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5C6D7\nE8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7i8j9\nQIDAQAB\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAluUD17iTjHYv\nxZx9fR5DDxXrL0Hwrsvp7isj2nejabV/yzu7i/nDrHvLzP0DQHULYPcThfZnh8n5\nK0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1\nq2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3\nW4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5\nC6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7\ni8j9QIDAQABAgEBALtm8F5l3G6N2P8a9k4v1x7w2y9D3K8E4h6L2b9N7S1d5H8r\nV3c9k5P7m6z2j9T4F8w3q1L5y2N8o6t4e9u0a7i3B6c8D1F2G5h7J9k3L6M8n0P2\nQ5r7s9T1u4V6w8X0y2Z4a6B8c0D2e4F6g8H0i2J4k6L8m0n2O4p6Q8r0S2t4U6v8\nW0x2Y4z6A8b0C2d4E6f8G0h2I4j6K8l0M2n4o6P8q0R2s4T6u8V0w2X4y6Z8a0b2\nC4d6e8F0g2H4i6j8K0l2M4n6o8P0q2R4s6t8U0v2W4x6y8Z0a2b4C6d8e0F2g4H6\ni8j0K2l4M6n8o0P2QAoGBAOdT8y7L2v5n3K9g1F6j4E8m0a7z5P2w9R3s6V4y8B1\nC2D5e7G0h3I6j9K2l5M8n1o4P7q0r3S6t9u2V5w8X1y4Z7a0b3C6d9e2F5g8H1i4\nJ7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3G6h9I2j5K8l1M4n7o0\nP3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5O8p1q4R7s0T3u6\nV9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1u4V7w0X3y6Z9a2\nAoGBAOQ6v3f0G4T8k1B7u2e5y8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9H2k5\nn8Q1t4w7z0C3f6I9l2o5R8u1x4A7d0g3J6m9p2s5V8y1B4e7h0K3n6q9T2w5z8C1\nf4I7l0o3R6u9x2A5d8g1J4m7p0s3V6y9B2e5h8K1n4q7T0w3z6C9f2I5l8o1r4U7\nx0A3d6g9J2m5p8s1V4y7B0e3h6K9n2q5T8w1z4C7f0I3l6o9r2U5x8A1d4g7J0m3\np6s9V2y5B8e1h4K7n0q3T6w9z2C5f8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9\nAoGBAMG9j3k6n0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5\nO8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1\nu4V7w0X3y6Z9a2b5C8d1e4F7g0H3i6J9k2L5m8n1O4p7Q0r3s6T9u2V5w8X1y4Z7\na0b3C6d9e2F5g8H1i4J7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3\nG6h9I2j5K8l1M4n7o0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9\nM2n5O8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5\ns8T1u4V7w0X3y6Z9a2\n-----END PRIVATE KEY-----',
    algorithm: 'RS384',
    description: 'RSA signature with SHA-384 (asymmetric)'
  },
  'rs512': {
    name: '🔒 RS512 (RSA SHA-512)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwJb5A9e4k4x2L8WcfX0e\nQw8V6y9B8K7L6e4rI9p3o2m1f8s7u4v5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1\nM2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3\ns4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5\nY6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5C6D7\nE8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7i8j9\nQIDAQAB\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAluUD17iTjHYv\nxZx9fR5DDxXrL0Hwrsvp7isj2nejabV/yzu7i/nDrHvLzP0DQHULYPcThfZnh8n5\nK0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1\nq2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3\nW4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5\nC6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7\ni8j9QIDAQABAgEBALtm8F5l3G6N2P8a9k4v1x7w2y9D3K8E4h6L2b9N7S1d5H8r\nV3c9k5P7m6z2j9T4F8w3q1L5y2N8o6t4e9u0a7i3B6c8D1F2G5h7J9k3L6M8n0P2\nQ5r7s9T1u4V6w8X0y2Z4a6B8c0D2e4F6g8H0i2J4k6L8m0n2O4p6Q8r0S2t4U6v8\nW0x2Y4z6A8b0C2d4E6f8G0h2I4j6K8l0M2n4o6P8q0R2s4T6u8V0w2X4y6Z8a0b2\nC4d6e8F0g2H4i6j8K0l2M4n6o8P0q2R4s6t8U0v2W4x6y8Z0a2b4C6d8e0F2g4H6\ni8j0K2l4M6n8o0P2QAoGBAOdT8y7L2v5n3K9g1F6j4E8m0a7z5P2w9R3s6V4y8B1\nC2D5e7G0h3I6j9K2l5M8n1o4P7q0r3S6t9u2V5w8X1y4Z7a0b3C6d9e2F5g8H1i4\nJ7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3G6h9I2j5K8l1M4n7o0\nP3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5O8p1q4R7s0T3u6\nV9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1u4V7w0X3y6Z9a2\nAoGBAOQ6v3f0G4T8k1B7u2e5y8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9H2k5\nn8Q1t4w7z0C3f6I9l2o5R8u1x4A7d0g3J6m9p2s5V8y1B4e7h0K3n6q9T2w5z8C1\nf4I7l0o3R6u9x2A5d8g1J4m7p0s3V6y9B2e5h8K1n4q7T0w3z6C9f2I5l8o1r4U7\nx0A3d6g9J2m5p8s1V4y7B0e3h6K9n2q5T8w1z4C7f0I3l6o9r2U5x8A1d4g7J0m3\np6s9V2y5B8e1h4K7n0q3T6w9z2C5f8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9\nAoGBAMG9j3k6n0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5\nO8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1\nu4V7w0X3y6Z9a2b5C8d1e4F7g0H3i6J9k2L5m8n1O4p7Q0r3s6T9u2V5w8X1y4Z7\na0b3C6d9e2F5g8H1i4J7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3\nG6h9I2j5K8l1M4n7o0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9\nM2n5O8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5\ns8T1u4V7w0X3y6Z9a2\n-----END PRIVATE KEY-----',
    algorithm: 'RS512',
    description: 'RSA signature with SHA-512 (asymmetric)'
  },
  'ps256': {
    name: '🔒 PS256 (RSA-PSS SHA-256)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwJb5A9e4k4x2L8WcfX0e\nQw8V6y9B8K7L6e4rI9p3o2m1f8s7u4v5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1\nM2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3\ns4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5\nY6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5C6D7\nE8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7i8j9\nQIDAQAB\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAluUD17iTjHYv\nxZx9fR5DDxXrL0Hwrsvp7isj2nejabV/yzu7i/nDrHvLzP0DQHULYPcThfZnh8n5\nK0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1\nq2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3\nW4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5\nC6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f5g6h7\ni8j9QIDAQABAgEBALtm8F5l3G6N2P8a9k4v1x7w2y9D3K8E4h6L2b9N7S1d5H8r\nV3c9k5P7m6z2j9T4F8w3q1L5y2N8o6t4e9u0a7i3B6c8D1F2G5h7J9k3L6M8n0P2\nQ5r7s9T1u4V6w8X0y2Z4a6B8c0D2e4F6g8H0i2J4k6L8m0n2O4p6Q8r0S2t4U6v8\nW0x2Y4z6A8b0C2d4E6f8G0h2I4j6K8l0M2n4o6P8q0R2s4T6u8V0w2X4y6Z8a0b2\nC4d6e8F0g2H4i6j8K0l2M4n6o8P0q2R4s6t8U0v2W4x6y8Z0a2b4C6d8e0F2g4H6\ni8j0K2l4M6n8o0P2QAoGBAOdT8y7L2v5n3K9g1F6j4E8m0a7z5P2w9R3s6V4y8B1\nC2D5e7G0h3I6j9K2l5M8n1o4P7q0r3S6t9u2V5w8X1y4Z7a0b3C6d9e2F5g8H1i4\nJ7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3G6h9I2j5K8l1M4n7o0\nP3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5O8p1q4R7s0T3u6\nV9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1u4V7w0X3y6Z9a2\nAoGBAOQ6v3f0G4T8k1B7u2e5y8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9H2k5\nn8Q1t4w7z0C3f6I9l2o5R8u1x4A7d0g3J6m9p2s5V8y1B4e7h0K3n6q9T2w5z8C1\nf4I7l0o3R6u9x2A5d8g1J4m7p0s3V6y9B2e5h8K1n4q7T0w3z6C9f2I5l8o1r4U7\nx0A3d6g9J2m5p8s1V4y7B0e3h6K9n2q5T8w1z4C7f0I3l6o9r2U5x8A1d4g7J0m3\np6s9V2y5B8e1h4K7n0q3T6w9z2C5f8I1l4o7r0U3x6A9d2g5j8M1p4s7v0Y3b6e9\nAoGBAMG9j3k6n0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9M2n5\nO8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5s8T1\nu4V7w0X3y6Z9a2b5C8d1e4F7g0H3i6J9k2L5m8n1O4p7Q0r3s6T9u2V5w8X1y4Z7\na0b3C6d9e2F5g8H1i4J7k0l3M6n9o2P5q8r1S4t7U0v3W6x9y2Z5a8B1c4D7e0f3\nG6h9I2j5K8l1M4n7o0P3q6R9s2T5u8V1w4X7y0Z3a6b9c2d5E8f1G4h7I0j3K6l9\nM2n5O8p1q4R7s0T3u6V9w2X5y8Z1a4b7C0d3e6F9g2H5i8J1k4L7m0n3O6p9Q2r5\ns8T1u4V7w0X3y6Z9a2\n-----END PRIVATE KEY-----',
    algorithm: 'PS256',
    description: 'RSA-PSS signature with SHA-256 (asymmetric)'
  },
  'es256': {
    name: '🌐 ES256 (ECDSA SHA-256)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEn2Le7+rjNyDbsNB15fG4h8/2fV4r\nG3fM5x7L2P9k0s1m8n2o3p4q5r6s7t8u9v0w1x2y3z4A5b6c7d8e9f0g1h2i3j4k\n5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0A1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q\n7r8s9t0u1v2w3x4y5z6A7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgp2DV3b6A9j8K1m5N\n0s2r4q7L8x3y6z9C2d5f8g1h4i7k0s3t6u9v2w5x8y1z4A7b0c3d6e9f2g5h8i1j\nk0l3m6n9o2p5q8r1s4t7u0v3w6x9y2z5A8b1c4d7e0f3g6h9i2j5k8l1m4n7o0p3\nq6r9s2t5u8v1w4x7y0z3a6b9c2d5e8f1g4h7i0j3k6l9m2n5o8p1q4r7s0t3u6v9\n-----END PRIVATE KEY-----',
    algorithm: 'ES256',
    description: 'ECDSA signature with SHA-256 (asymmetric)'
  },
  'es384': {
    name: '🌐 ES384 (ECDSA SHA-384)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEn2Le7+rjNyDbsNB15fG4h8/2fV4rG3fM\n5x7L2P9k0s1m8n2o3p4q5r6s7t8u9v0w1x2y3z4A5b6c7d8e9f0g1h2i3j4k5l6m\n7n8o9p0q1r2s3t4u5v6w7x8y9z0A1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s\n9t0u1v2w3x4y5z6A7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDCnYNXdvoD2PwrWbk3S\nzavirsvy=fbrNqRo7cchx9TJpvgMGXh7uoKhRANCAASfYt7v6uM3INuw0HXl8biHz\n/Z9XisbECKdg1d2+gPY/CtZuTdLNq+Kuy/Ld5ubm5ubm5ubm5ubm5ubm5ubm5ubm\n5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm\n5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm\n-----END PRIVATE KEY-----',
    algorithm: 'ES384',
    description: 'ECDSA signature with SHA-384 (asymmetric)'
  },
  'es512': {
    name: '🌐 ES512 (ECDSA SHA-512)',
    secret: '',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBn2Le7+rjNyDbsNB15fG4h8/2fV4r\nG3fM5x7L2P9k0s1m8n2o3p4q5r6s7t8u9v0w1x2y3z4A5b6c7d8e9f0g1h2i3j4k\n5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0A1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q\n7r8s9t0u1v2w3x4y5z6A7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w\n9x0y1z2A3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8A9b0c\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIAp2DV3b6A9j8K1m5N\n0s2r4q7L8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL\n8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbL8vbLoUQDQgAEn2Le\n7+rjNyDbsNB15fG4h8/2fV4rG3fM5x7L2P9k0s1m8n2o3p4q5r6s7t8u9v0w1x2y\n3z4A5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0A1b2c3d4e\n5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7b8c9d0e1f2g3h4i5j6k\n7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2A3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q\n9r0s1t2u3v4w5x6y7z8A9b0c\n-----END PRIVATE KEY-----',
    algorithm: 'ES512',
    description: 'ECDSA signature with SHA-512 (asymmetric)'
  }
};

type ExampleKey = keyof typeof JWT_EXAMPLES;

const DEFAULT_PAYLOAD = {
  "sub": "1234567890",
  "name": "John Doe",
  "iat": Math.floor(Date.now() / 1000),
  "exp": Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
};

const DEFAULT_HEADER = {
  "alg": "HS256",
  "typ": "JWT"
};

export const JwtTool: React.FC = () => {
  const [token, setToken] = useState('');
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
        
        // Only show error if we're actively editing and missing keys
        const shouldShowKeyError = header.alg.startsWith('HS') ? !secret.trim() : !privateKey.trim();
        
        setValidation(prev => ({
          ...prev,
          decoded: { header, payload, signature: prev.decoded?.signature || '' },
          algorithm: header.alg,
          expired,
          isSignatureValid: null,
          signatureError: shouldShowKeyError ? 'Provide secret/private key to generate signature automatically 😞' : null
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

  const loadExampleToken = async (exampleKey: ExampleKey) => {
    const example = JWT_EXAMPLES[exampleKey];
    setIsLoadingExample(true);
    
    try {
      // Use current payload or default if no token exists
      let currentPayload = DEFAULT_PAYLOAD;
      let currentHeader = { ...DEFAULT_HEADER, alg: example.algorithm };
      
      if (validation.decoded) {
        currentPayload = validation.decoded.payload;
        currentHeader = { ...validation.decoded.header, alg: example.algorithm };
      }
      
      // Generate new token with current payload and new algorithm/keys
      const newToken = await generateNewToken(currentHeader, currentPayload);
      
      if (newToken) {
        // Set everything atomically to avoid useEffect conflicts
        setToken(newToken);
        setSecret(example.secret);
        setPublicKey(example.publicKey);
        setPrivateKey(example.privateKey);
        setSelectedTab(example.algorithm.startsWith('HS') ? 'hmac' : 'rsa');
        setIsEditing(false);
        
        // Update key signature to prevent auto-regeneration loop
        const newKeySignature = `${example.secret}|${example.privateKey}|${example.algorithm}`;
        setLastKeySignature(newKeySignature);
        
        toast.success(`Switched to ${example.name}! 🎯`);
      } else {
        // If we can't generate a token (missing private key for asymmetric)
        // Still set the keys for demo purposes
        setSecret(example.secret);
        setPublicKey(example.publicKey);
        setPrivateKey(example.privateKey);
        setSelectedTab(example.algorithm.startsWith('HS') ? 'hmac' : 'rsa');
        setIsEditing(false);
        
        // Create a demo token structure for display only
        const demoToken = `${btoa(JSON.stringify(currentHeader))}.${btoa(JSON.stringify(currentPayload))}.demo-signature-provide-${example.algorithm.startsWith('HS') ? 'secret' : 'private'}-key`;
        setToken(demoToken);
        
        toast.success(`Loaded ${example.name} - provide ${example.algorithm.startsWith('HS') ? 'secret key' : 'private key'} to generate valid signature! 🔑`);
      }
    } catch (error) {
      console.error('Error loading example:', error);
      toast.error('Failed to load example');
    } finally {
      setTimeout(() => {
        setIsLoadingExample(false);
      }, 200);
    }
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
      
      // Only regenerate if keys actually changed and we have a valid lastKeySignature
      if (!lastKeySignature || currentKeySignature === lastKeySignature) return;
      
      const { header, payload } = validation.decoded;
      const newToken = await generateNewToken(header, payload);
      
      if (newToken && newToken !== token) {
        setToken(newToken);
        setLastKeySignature(currentKeySignature);
        toast.success('Token signature updated! 🔐✨');
      }
    };
    
    const timeoutId = setTimeout(autoRegenerateToken, 500);
    return () => clearTimeout(timeoutId);
  }, [secret, privateKey, validation.decoded?.header.alg, isEditing, lastKeySignature, isLoadingExample]); // Remove token dependency to avoid loops

  // Initial load - create default token
  useEffect(() => {
    const initializeToken = async () => {
      if (!token) {
        // Generate initial token with default payload and HS256
        const initialToken = await generateNewToken(DEFAULT_HEADER, DEFAULT_PAYLOAD);
        if (initialToken) {
          setToken(initialToken);
          setSecret('your-256-bit-secret');
          // Set initial key signature to prevent auto-regeneration
          const initialKeySignature = `your-256-bit-secret||HS256`;
          setLastKeySignature(initialKeySignature);
        }
      }
      // Don't call processToken here to avoid double processing
    };
    
    initializeToken();
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
