import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Edit3 } from 'lucide-react';
import { JwtChecker } from './JwtChecker';
import { JwtEditor } from './JwtEditor';

export const JwtTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('checker');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-2xl">JWT Toolkit 📄✨</CardTitle>
          </div>
          <CardDescription>
            Complete JWT debugging and creation suite - decode, verify, and generate JSON Web Tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="checker" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Token Checker 🔍
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Token Editor ✏️
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checker" className="space-y-0">
              <JwtChecker />
            </TabsContent>

            <TabsContent value="editor" className="space-y-0">
              <JwtEditor />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};