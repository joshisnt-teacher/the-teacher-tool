import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { ArrowLeft, BookOpen, FileText, Tag, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useCurriculumWithCounts } from '@/hooks/useCurriculumWithCounts';
import { useStrands, useStrandById } from '@/hooks/useStrands';
import { useContentItems, useContentItemById } from '@/hooks/useContentItems';

const CurriculumBrowser = () => {
  const { strandId, contentItemId } = useParams();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);
  
  // Fetch curriculum data with dynamic content counts
  const { data: curriculumListWithCounts = [], isLoading: isLoadingCurriculum } = useCurriculumWithCounts();
  
  // Fallback to basic curriculum list if counts fail
  const { data: fallbackCurriculumList = [] } = useCurriculum();
  const curriculumList = curriculumListWithCounts.length > 0 ? curriculumListWithCounts : fallbackCurriculumList;
  
  // Sort curricula by year group order (7, 8, 9, 10)
  const sortedCurriculumList = [...curriculumList].sort((a, b) => {
    // Extract year number for proper numeric sorting
    const getYearNumber = (yearBand: string) => {
      const match = yearBand.match(/Year (\d+)/);
      return match ? parseInt(match[1], 10) : 999; // 999 for any non-standard format
    };
    
    return getYearNumber(a.year_band) - getYearNumber(b.year_band);
  });
  
  // Select curriculum - prioritize the one with most content, then first available
  const curriculum = curriculumList.find(c => c.id === selectedCurriculumId) || 
                    curriculumList.find(c => (c as any).content_items_count > 0) || 
                    curriculumList[0];
  
  // Fetch strand data
  const { data: strands = [], isLoading: isLoadingStrands } = useStrands(curriculum?.id);
  const { data: currentStrand, isLoading: isLoadingCurrentStrand } = useStrandById(strandId);
  
  // Fetch content item data
  const { data: contentItems = [], isLoading: isLoadingContentItems } = useContentItems({
    strandId: strandId
  });
  const { data: currentContentItem, isLoading: isLoadingCurrentContentItem } = useContentItemById(contentItemId);

  const isLoading = isLoadingCurriculum || isLoadingStrands || isLoadingCurrentStrand || 
                   isLoadingContentItems || isLoadingCurrentContentItem;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading curriculum data...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">No curriculum data found</h1>
          <p className="text-muted-foreground mb-4">
            {curriculumList.length === 0 
              ? "Please check that curriculum data has been loaded and you are logged in."
              : "Please select a curriculum from the options above."
            }
          </p>
          <Link to="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderBreadcrumb = () => (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/curriculum-browser">
            {curriculum.authority} · {curriculum.learning_area} · {curriculum.year_band}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentStrand && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {currentContentItem ? (
                <BreadcrumbLink href={`/curriculum-browser/strand/${currentStrand.id}`}>
                  {currentStrand.name}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{currentStrand.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {currentContentItem && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentContentItem.code}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

  // Step 3: Content Item Details
  if (currentContentItem) {
    const capabilities = currentContentItem.tags?.filter(tag => tag.type === 'capability') || [];
    const concepts = currentContentItem.tags?.filter(tag => tag.type === 'concept') || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {renderBreadcrumb()}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{currentContentItem.code}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {currentStrand?.name}
                  </CardDescription>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-foreground leading-relaxed">{currentContentItem.description}</p>
              </div>

              {concepts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Key Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {concepts.map((concept) => (
                      <Badge key={concept.id} variant="secondary">
                        {concept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {capabilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    General Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((capability) => (
                      <Badge key={capability.id} variant="outline">
                        {capability.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Strand Details
  if (currentStrand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/curriculum-browser')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Curriculum
            </Button>
            {renderBreadcrumb()}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{currentStrand.name}</CardTitle>
              <CardDescription>
                Content items in this strand from {curriculum.authority} · {curriculum.learning_area} · {curriculum.year_band}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item) => (
              <Card 
                key={item.id} 
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/curriculum-browser/content/${item.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{item.code}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Curriculum Overview
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          {renderBreadcrumb()}
        </div>

        {/* Curriculum Selector */}
        {curriculumList.length > 1 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">HASS Curriculum</CardTitle>
              <CardDescription>
                Choose which year level curriculum to explore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {sortedCurriculumList.map((curriculumOption) => {
                  // Use dynamic content counts from database
                  const contentItemsCount = (curriculumOption as any).content_items_count || 0;
                  const hasContentItems = contentItemsCount > 0;
                  const contentCount = hasContentItems 
                    ? `${contentItemsCount} item${contentItemsCount !== 1 ? 's' : ''}`
                    : 'No content';
                  const badgeColor = hasContentItems ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                  
                  return (
                    <Button
                      key={curriculumOption.id}
                      variant={curriculum?.id === curriculumOption.id ? "default" : "outline"}
                      onClick={() => setSelectedCurriculumId(curriculumOption.id)}
                      className="justify-start h-auto p-4 relative"
                    >
                      <div className="text-left">
                        <div className="font-medium flex items-center gap-2">
                          {curriculumOption.year_band}
                          <span className={`text-xs ${badgeColor} px-2 py-1 rounded`}>
                            {contentCount}
                          </span>
                        </div>
                        <div className="text-xs opacity-70">
                          {curriculumOption.authority} · {curriculumOption.learning_area}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              {curriculum.authority} · {curriculum.learning_area} · {curriculum.year_band}
            </CardTitle>
            <CardDescription className="text-lg">
              Version {curriculum.version}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Year Level Description</h3>
                <div className="bg-muted/50 rounded-lg p-4 relative">
                  <div 
                    className={`text-foreground leading-relaxed whitespace-pre-wrap transition-all duration-300 overflow-hidden ${
                      isDescriptionExpanded ? 'max-h-none' : 'max-h-24'
                    }`}
                  >
                    {curriculum.year_level_description}
                  </div>
                  {curriculum.year_level_description && curriculum.year_level_description.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 h-8 px-2 text-xs"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Read Less <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Read More <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Learning Areas & Strands</h2>
          <p className="text-muted-foreground">
            Select a strand to explore its content items and learning descriptors.
          </p>
          {curriculum && ((curriculum as any).content_items_count || 0) === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ This curriculum year ({curriculum.year_band}) has no content items. Try selecting a different year level above.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strands.map((strand) => (
            <Card 
              key={strand.id} 
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/curriculum-browser/strand/${strand.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  {strand.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore content items and learning descriptors for {strand.name.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumBrowser;