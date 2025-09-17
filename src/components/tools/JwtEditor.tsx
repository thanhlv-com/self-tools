import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Edit3, Download, Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SignJWT, importPKCS8 } from 'jose';

interface JWTComponents {
  header: any;
  payload: any;
  secret: string;
  algorithm: string;
}

const ALGORITHMS = [
  { value: 'HS256', label: 'HS256 (HMAC SHA-256)', type: 'hmac' },
  { value: 'HS384', label: 'HS384 (HMAC SHA-384)', type: 'hmac' },
  { value: 'HS512', label: 'HS512 (HMAC SHA-512)', type: 'hmac' },
  { value: 'RS256', label: 'RS256 (RSA SHA-256)', type: 'rsa' },
  { value: 'RS384', label: 'RS384 (RSA SHA-384)', type: 'rsa' },
  { value: 'RS512', label: 'RS512 (RSA SHA-512)', type: 'rsa' },
  { value: 'ES256', label: 'ES256 (ECDSA SHA-256)', type: 'ecdsa' },
  { value: 'ES384', label: 'ES384 (ECDSA SHA-384)', type: 'ecdsa' },
  { value: 'ES512', label: 'ES512 (ECDSA SHA-512)', type: 'ecdsa' },
  { value: 'PS256', label: 'PS256 (RSA-PSS SHA-256)', type: 'rsa-pss' },
  { value: 'PS384', label: 'PS384 (RSA-PSS SHA-384)', type: 'rsa-pss' },
  { value: 'PS512', label: 'PS512 (RSA-PSS SHA-512)', type: 'rsa-pss' }
];

const DEFAULT_HEADER = {
  "alg": "HS256",
  "typ": "JWT"
};

const DEFAULT_PAYLOAD = {
  "sub": "1234567890",
  "name": "John Doe",
  "iat": Math.floor(Date.now() / 1000),
  "exp": Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
};

export const JwtEditor: React.FC = () => {
  const [components, setComponents] = useState<JWTComponents>({
    header: DEFAULT_HEADER,
    payload: DEFAULT_PAYLOAD,
    secret: 'your-256-bit-secret',
    algorithm: 'HS256'
  });
  
  const [headerText, setHeaderText] = useState(JSON.stringify(DEFAULT_HEADER, null, 2));
  const [payloadText, setPayloadText] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2));
  const [privateKey, setPrivateKey] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [error, setError] = useState('');

  const generateToken = async () => {
    try {
      setError('');
      
      // Parse header and payload
      const header = JSON.parse(headerText);
      const payload = JSON.parse(payloadText);
      
      let token = '';
      
      if (components.algorithm.startsWith('HS')) {
        // HMAC algorithms
        if (!components.secret.trim()) {
          throw new Error('Secret key is required for HMAC algorithms');
        }
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(components.secret);
        
        const jwt = new SignJWT(payload)
          .setProtectedHeader({ alg: components.algorithm, ...header });
        
        // Set standard claims if they exist
        if (payload.iss) jwt.setIssuer(payload.iss);
        if (payload.sub) jwt.setSubject(payload.sub);
        if (payload.aud) jwt.setAudience(payload.aud);
        if (payload.exp) jwt.setExpirationTime(payload.exp);
        if (payload.iat) jwt.setIssuedAt(payload.iat);
        if (payload.nbf) jwt.setNotBefore(payload.nbf);
        if (payload.jti) jwt.setJti(payload.jti);
        
        token = await jwt.sign(secretKey);
      } else if (components.algorithm.startsWith('RS') || 
                 components.algorithm.startsWith('PS') || 
                 components.algorithm.startsWith('ES')) {
        // RSA/ECDSA algorithms
        if (!privateKey.trim()) {
          throw new Error('Private key is required for RSA/ECDSA algorithms');
        }
        
        const key = await importPKCS8(privateKey, components.algorithm);
        
        const jwt = new SignJWT(payload)
          .setProtectedHeader({ alg: components.algorithm, ...header });
        
        // Set standard claims if they exist
        if (payload.iss) jwt.setIssuer(payload.iss);
        if (payload.sub) jwt.setSubject(payload.sub);
        if (payload.aud) jwt.setAudience(payload.aud);
        if (payload.exp) jwt.setExpirationTime(payload.exp);
        if (payload.iat) jwt.setIssuedAt(payload.iat);
        if (payload.nbf) jwt.setNotBefore(payload.nbf);
        if (payload.jti) jwt.setJti(payload.jti);
        
        token = await jwt.sign(key);
      }
      
      setGeneratedToken(token);
      toast.success('JWT token generated successfully!');
    } catch (err: any) {
      setError(err.message);
      setGeneratedToken('');
    }
  };

  const loadFromToken = (token: string) => {
    try {
      setError('');
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      setHeaderText(JSON.stringify(header, null, 2));
      setPayloadText(JSON.stringify(payload, null, 2));
      setComponents(prev => ({
        ...prev,
        header,
        payload,
        algorithm: header.alg || 'HS256'
      }));
      
      toast.success('Token loaded successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadToken = () => {
    if (!generatedToken) return;
    
    const blob = new Blob([generatedToken], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwt-token.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Token downloaded!');
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
      toast.success('Common claims added!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedAlgorithm = ALGORITHMS.find(alg => alg.value === components.algorithm);

  useEffect(() => {
    generateToken();
  }, [components.algorithm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-green-500" />
            <CardTitle>JWT Token Editor ✏️</CardTitle>
          </div>
          <CardDescription>
            Create and edit JSON Web Tokens with support for multiple algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="algorithm">Algorithm 🔐</Label>
              <Select
                value={components.algorithm}
                onValueChange={(value) => setComponents(prev => ({ ...prev, algorithm: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  {ALGORITHMS.map((alg) => (
                    <SelectItem key={alg.value} value={alg.value}>
                      {alg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Load from existing token</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste JWT token to load..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      loadFromToken(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Paste JWT token to load..."]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      loadFromToken(input.value.trim());
                      input.value = '';
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {selectedAlgorithm?.type === 'hmac' && (
            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key</Label>
              <Input
                id="secret"
                type="password"
                placeholder="your-256-bit-secret"
                value={components.secret}
                onChange={(e) => setComponents(prev => ({ ...prev, secret: e.target.value }))}
              />
            </div>
          )}

          {(selectedAlgorithm?.type === 'rsa' || selectedAlgorithm?.type === 'rsa-pss' || selectedAlgorithm?.type === 'ecdsa') && (
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Textarea
                id="privateKey"
                placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JWT Header</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHeaderText(JSON.stringify({ ...DEFAULT_HEADER, alg: components.algorithm }, null, 2))}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="JWT Header JSON"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="payload" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JWT Payload</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addCommonClaims}
                  >
                    Add Claims
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPayloadText(JSON.stringify(DEFAULT_PAYLOAD, null, 2))}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="JWT Payload JSON"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={generateToken} className="flex-1">
              Generate Token
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedToken && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated JWT Token</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedToken)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadToken}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {generatedToken}
              </div>
              <div className="text-sm text-muted-foreground">
                Token length: {generatedToken.length} characters
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">HMAC Algorithms (Symmetric)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• HS256: HMAC using SHA-256</li>
                <li>• HS384: HMAC using SHA-384</li>
                <li>• HS512: HMAC using SHA-512</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">RSA/ECDSA Algorithms (Asymmetric)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• RS256/384/512: RSA using SHA</li>
                <li>• PS256/384/512: RSA-PSS using SHA</li>
                <li>• ES256/384/512: ECDSA using SHA</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};