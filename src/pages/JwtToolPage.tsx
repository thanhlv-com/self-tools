import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Shield, Clock, User, AlertTriangle, CheckCircle2, XCircle, Key, RefreshCw, Download, FileSignature, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { jwtVerify, importSPKI, SignJWT, importPKCS8 } from 'jose';
import { PageLayout } from "@/components/PageLayout";

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

const JwtToolPage = () => {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.reGQzG3OKdoIMWLDKOZ4TICJit3EW69cQE72E2CfzRE');
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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

  const manualSignToken = async () => {
    if (!isEditing) {
      toast.error('Please enter edit mode to sign the token 📝');
      return;
    }

    try {
      const header = JSON.parse(headerText);
      const payload = JSON.parse(payloadText);
      
      const newToken = await generateNewToken(header, payload);
      
      if (newToken) {
        setToken(newToken);
        toast.success('Token signed successfully! 🔐✨');
      } else {
        const algorithm = header.alg;
        const keyType = algorithm.startsWith('HS') ? 'secret key' : 'private key';
        toast.error(`Cannot sign token: ${keyType} is required for ${algorithm} algorithm 🔑`);
      }
    } catch (error) {
      toast.error('Cannot sign token: Invalid JSON in header or payload 📋');
    }
  };

  const manualVerifyToken = async () => {
    if (!token.trim()) {
      toast.error('Please provide a JWT token to verify 📝');
      return;
    }

    await processToken(token);
    
    if (validation.isSignatureValid === true) {
      toast.success('Token signature is valid! ✅');
    } else if (validation.isSignatureValid === false) {
      toast.error(`Token signature is invalid: ${validation.signatureError || 'Unknown error'} ❌`);
    } else {
      toast.warning('Cannot verify signature: Please provide the appropriate secret key or public key 🔑');
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

  // Handle manual edits to header/payload - only update decoded content for display
  const handleEditedContentChange = useCallback(async () => {
    if (!isEditing) return;
    
    try {
      const header = JSON.parse(headerText);
      const payload = JSON.parse(payloadText);
      
      // Just update the decoded content for display without auto-signing
      const now = Math.floor(Date.now() / 1000);
      const expired = payload.exp && payload.exp < now;
      
      setValidation(prev => ({
        ...prev,
        decoded: { header, payload, signature: prev.decoded?.signature || '' },
        algorithm: header.alg,
        expired,
        isSignatureValid: null,
        signatureError: null
      }));
    } catch (error) {
      // Invalid JSON, don't update anything
    }
  }, [headerText, payloadText, isEditing]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard! 📋');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
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

  // Initial load - set default content for editing
  useEffect(() => {
    if (!token && !headerText && !payloadText) {
      setHeaderText(JSON.stringify(DEFAULT_HEADER, null, 2));
      setPayloadText(JSON.stringify(DEFAULT_PAYLOAD, null, 2));
      setSecret('your-256-bit-secret');
    }
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
    <PageLayout
      title="JWT Toolkit 📄✨"
      description="Complete JWT debugging & creation 📄✨"
      activeTool="jwt-tool"
    >
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={manualSignToken}
                      disabled={!isEditing}
                    >
                      <FileSignature className="h-4 w-4 mr-1" />
                      Sign 🔐
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={manualVerifyToken}
                      disabled={!token.trim()}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verify ✅
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? '👁️ View Mode' : '✏️ Edit Mode'}
                    </Button>
                  </div>
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
    </PageLayout>
  );
};

export default JwtToolPage;