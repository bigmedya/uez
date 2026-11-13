/**
 * OneSignal Notification Manager Component
 * OneSignal bildirimleri yönetmek için React komponenti
 */

import React, { useEffect, useState } from 'react';
import { useOneSignalNotifications } from '../hooks/useOneSignalNotifications';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, Bell, BellOff, TestTube, BarChart3, User, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface OneSignalManagerProps {
  showStats?: boolean;
  showTesting?: boolean;
  showTags?: boolean;
  className?: string;
}

export const OneSignalManager: React.FC<OneSignalManagerProps> = ({
  showStats = false,
  showTesting = false,
  showTags = false,
  className = ''
}) => {
  const {
    isSupported,
    isLoading,
    isSubscribed,
    userId,
    permission,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    getTags,
    sendTags,
    getStats,
    clearError,
    refresh
  } = useOneSignalNotifications();

  const [stats, setStats] = useState<any>(null);
  const [tags, setUserTags] = useState<Record<string, string>>({});
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // İstatistikleri yükle
  const loadStats = async () => {
    if (!showStats) return;
    
    setIsLoadingStats(true);
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Stats yükleme hatası:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Tag'ları yükle
  const loadTags = async () => {
    if (!showTags) return;
    
    setIsLoadingTags(true);
    try {
      const userTags = await getTags();
      setUserTags(userTags || {});
    } catch (error) {
      console.error('Tags yükleme hatası:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Component mount olduğunda verileri yükle
  useEffect(() => {
    if (isSubscribed) {
      loadStats();
      loadTags();
    }
  }, [isSubscribed, showStats, showTags]);

  // Abone olmak için buton handler
  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Bildirimlere başarıyla abone oldunuz!');
      loadStats();
      loadTags();
    } else {
      toast.error('Abonelik sırasında hata oluştu.');
    }
  };

  // Abonelikten çıkmak için buton handler
  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Bildirim aboneliğiniz iptal edildi.');
    } else {
      toast.error('Abonelik iptali sırasında hata oluştu.');
    }
  };

  // Test bildirimi gönder
  const handleSendTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast.success('Test bildirimi gönderildi!');
    } else {
      toast.error('Test bildirimi gönderilemedi.');
    }
  };

  // Yeni tag ekle
  const handleAddTag = async () => {
    if (!newTagKey.trim() || !newTagValue.trim()) {
      toast.error('Tag anahtarı ve değeri boş olamaz.');
      return;
    }

    const success = await sendTags({ [newTagKey]: newTagValue });
    if (success) {
      toast.success('Tag başarıyla eklendi!');
      setNewTagKey('');
      setNewTagValue('');
      loadTags();
    } else {
      toast.error('Tag eklenirken hata oluştu.');
    }
  };

  // Desteklenmiyor mesajı
  if (!isSupported && !isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Tarayıcınız push bildirimleri desteklemiyor veya OneSignal yüklenemiyor.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Bildirimleri
        </CardTitle>
        <CardDescription>
          OneSignal ile push bildirimlerini yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">OneSignal yükleniyor...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={clearError}>
                Temizle
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Information */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Durum:</span>
              <div className="flex items-center gap-2 mt-1">
                {isSubscribed ? (
                  <Badge variant="default">Abone</Badge>
                ) : (
                  <Badge variant="secondary">Abone Değil</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">İzin:</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={permission === 'granted' ? 'default' : 
                           permission === 'denied' ? 'destructive' : 'secondary'}
                >
                  {permission === 'granted' ? 'Verildi' :
                   permission === 'denied' ? 'Reddedildi' : 'Bekliyor'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* User ID */}
        {userId && (
          <div>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-4 w-4" />
              OneSignal ID:
            </span>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {userId}
            </p>
          </div>
        )}

        {/* Subscription Controls */}
        {!isLoading && (
          <div className="flex gap-2">
            {isSubscribed ? (
              <Button variant="outline" onClick={handleUnsubscribe}>
                <BellOff className="h-4 w-4 mr-2" />
                Aboneliği İptal Et
              </Button>
            ) : (
              <Button onClick={handleSubscribe}>
                <Bell className="h-4 w-4 mr-2" />
                Bildirimlere Abone Ol
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={refresh}>
              Yenile
            </Button>
          </div>
        )}

        {/* Testing Section */}
        {showTesting && isSubscribed && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </h4>
            <Button variant="outline" size="sm" onClick={handleSendTest}>
              Test Bildirimi Gönder
            </Button>
          </div>
        )}

        {/* Stats Section */}
        {showStats && stats && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              İstatistikler
            </h4>
            {isLoadingStats ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Yükleniyor...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Toplam Abone:</span>
                  <p className="font-medium">{stats.totalSubscribers}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Aktif Abone:</span>
                  <p className="font-medium">{stats.activeSubscribers}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tıklama Oranı:</span>
                  <p className="font-medium">{(stats.clickRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teslimat Oranı:</span>
                  <p className="font-medium">{(stats.deliveryRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        {showTags && isSubscribed && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Kullanıcı Tag'ları
            </h4>
            
            {isLoadingTags ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Yükleniyor...
              </div>
            ) : (
              <div className="space-y-2">
                {/* Mevcut Tag'lar */}
                {Object.keys(tags).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(tags).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{key}</Badge>
                        <span className="text-muted-foreground">=</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Henüz tag eklenmemiş.</p>
                )}
                
                {/* Yeni Tag Ekleme */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Anahtar"
                    value={newTagKey}
                    onChange={(e) => setNewTagKey(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Değer"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Ekle
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};