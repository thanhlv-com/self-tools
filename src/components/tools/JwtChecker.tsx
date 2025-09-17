import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Shield, Clock, User, AlertTriangle, CheckCircle2, XCircle, Info, Key } from 'lucide-react';
import { toast } from 'sonner';
import { jwtVerify, importSPKI } from 'jose';

interface DecodedJWT {
  header: any;
  payload: any;
  signature: string;
}

interface ValidationState {
  isValidFormat: boolean;
  isSignatureValid: boolean | null; // null = not checked, true = valid, false = invalid
  decoded: DecodedJWT | null;
  algorithm: string | null;
  expired: boolean;
  error: string | null;
  signatureError: string | null;
}

const EXAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const JwtChecker: React.FC = () => {
  const [token, setToken] = useState(EXAMPLE_TOKEN);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [publicKey, setPublicKey] = useState('');
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
      return { isValid: false, error: null }; // No key provided, don't attempt validation
    }

    try {
      const algorithm = decoded.header.alg;
      
      if (algorithm.startsWith('HS')) {
        // HMAC algorithms
        if (!secret.trim()) {
          return { isValid: false, error: 'Secret key required for HMAC algorithms' };
        }
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(secret);
        await jwtVerify(tokenString, secretKey, { algorithms: [algorithm] });
        return { isValid: true, error: null };
      } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS') || algorithm.startsWith('ES')) {
        // RSA/ECDSA algorithms
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

    // First, set the basic validation state
    setValidation(prev => ({
      ...prev,
      isValidFormat: true,
      decoded,
      algorithm,
      expired,
      error: null
    }));

    // Then, attempt signature validation
    const signatureResult = await validateSignature(tokenString, decoded);
    
    setValidation(prev => ({
      ...prev,
      isSignatureValid: secret.trim() || publicKey.trim() ? signatureResult.isValid : null,
      signatureError: signatureResult.error
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const loadExampleToken = () => {
    setToken(EXAMPLE_TOKEN);
    setSecret('your-256-bit-secret');
    setPublicKey('');
    setSelectedTab('hmac');
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

  useEffect(() => {
    const timeoutId = setTimeout(() => processToken(token), 300);
    return () => clearTimeout(timeoutId);
  }, [token, secret, publicKey]);

  // Initial load
  useEffect(() => {
    processToken(token);
  }, []);

  const getSignatureStatus = () => {
    if (validation.isSignatureValid === true) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        text: "Signature Verified",
        variant: "default" as const,
        className: "border-green-200 bg-green-50 text-green-800"
      };
    } else if (validation.isSignatureValid === false) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "Invalid Signature",
        variant: "destructive" as const,
        className: "border-red-200 bg-red-50 text-red-800"
      };
    } else {
      return {
        icon: <Info className="h-4 w-4 text-blue-500" />,
        text: "Not Verified",
        variant: "secondary" as const,
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
              <Shield className="h-5 w-5 text-blue-500" />
              <CardTitle>JWT Debugger 🔍🌐</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadExampleToken}>
                Load Example
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
            Decode and verify JSON Web Tokens. For your protection, all validation happens in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Encoded Token Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-semibold">
                  Encoded JWT Token
                </Label>
                <Textarea
                  id="token"
                  placeholder="Paste your JWT token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="min-h-[150px] font-mono text-xs resize-none"
                />
              </div>

              {/* Algorithm and Status */}
              {validation.decoded && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Algorithm:</Label>
                    <Badge variant="outline">{validation.algorithm}</Badge>
                  </div>
                  {validation.expired && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Token Expired
                    </Badge>
                  )}
                </div>
              )}

              {/* Signature Verification Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Verify Signature
                </Label>
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hmac">HMAC (HS256/384/512)</TabsTrigger>
                    <TabsTrigger value="rsa">RSA/ECDSA (RS/PS/ES)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hmac" className="space-y-2">
                    <Label htmlFor="secret" className="text-xs">Your 256-bit secret</Label>
                    <Input
                      id="secret"
                      placeholder="your-256-bit-secret"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to verify signatures of tokens signed with HMAC algorithms.
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="rsa" className="space-y-2">
                    <Label htmlFor="publicKey" className="text-xs">Public Key or Certificate</Label>
                    <Textarea
                      id="publicKey"
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      className="min-h-[80px] font-mono text-xs resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to verify signatures of tokens signed with RSA or ECDSA algorithms.
                    </p>
                  </TabsContent>
                </Tabs>

                {validation.signatureError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validation.signatureError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Decoded Token Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Decoded JWT</Label>
              
              {validation.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validation.error}</AlertDescription>
                </Alert>
              )}

              {validation.decoded && (
                <Tabs defaultValue="header" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header">Header</TabsTrigger>
                    <TabsTrigger value="payload">Payload</TabsTrigger>
                    <TabsTrigger value="signature">Signature</TabsTrigger>
                  </TabsList>

                  <TabsContent value="header" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">HEADER: ALGORITHM & TOKEN TYPE</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(validation.decoded!.header, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(validation.decoded.header, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="payload" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">PAYLOAD: DATA</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(validation.decoded!.payload, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="bg-purple-50 border border-purple-200 text-purple-800 p-3 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(validation.decoded.payload, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="signature" className="space-y-2">
                    <Label className="text-xs font-semibold">VERIFY SIGNATURE</Label>
                    <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-3 rounded-md">
                      <div className="text-xs font-mono break-all mb-2">
                        {validation.decoded.signature}
                      </div>
                      <div className="text-xs">
                        <p className="mb-2">
                          RSASHA256({' '}
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
                            {validation.algorithm?.startsWith('HS') ? 'your-256-bit-secret' : 'your-RSA-key'}
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
            <CardTitle className="text-lg">JWT Claims</CardTitle>
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
                        <Badge variant="secondary" className="text-xs">Standard</Badge>
                      )}
                      {key === 'exp' && validation.expired && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-sm break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                      {isTimestamp && (
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(value as number)}
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
          <strong>Security Notice:</strong> For your protection, all JWT decoding and verification happens entirely in your browser. 
          No token data is transmitted to any server. Always verify tokens using the proper secret or public key.
        </AlertDescription>
      </Alert>
    </div>
  );
};