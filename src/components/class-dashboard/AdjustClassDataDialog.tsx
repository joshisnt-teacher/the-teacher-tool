import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, X } from 'lucide-react';
import { Class } from '@/hooks/useClasses';
import { ClassBasicTab } from './adjust-class/ClassBasicTab';
import { ClassDatesTab } from './adjust-class/ClassDatesTab';
import { ClassStudentsTab } from './adjust-class/ClassStudentsTab';
import { ClassCriteriaTab } from './adjust-class/ClassCriteriaTab';

interface AdjustClassDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
}

export const AdjustClassDataDialog: React.FC<AdjustClassDataDialogProps> = ({
  isOpen,
  onClose,
  classData,
}) => {
  const [currentTab, setCurrentTab] = useState('basic');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Adjust Class Data - {classData.class_name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 shrink-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="dates">Date Range</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="criteria">Content Descriptors</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <TabsContent value="basic" className="mt-0">
                <ClassBasicTab classData={classData} onClose={onClose} />
              </TabsContent>
              <TabsContent value="dates" className="mt-0">
                <ClassDatesTab classData={classData} />
              </TabsContent>
              <TabsContent value="students" className="mt-0">
                <ClassStudentsTab classData={classData} />
              </TabsContent>
              <TabsContent value="criteria" className="mt-0">
                <ClassCriteriaTab classData={classData} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
