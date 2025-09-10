import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ChartLine, 
  Wallet, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Copy, 
  Settings, 
  Trash2,
  ExternalLink,
  RefreshCw,
  Bot,
  Award
} from "lucide-react";

// Form schemas
const connectAccountSchema = z.object({
  broker: z.enum(['exness', 'bybit', 'binance']),
  accountId: z.string().min(1, "Account ID is required"),
  accountName: z.string().min(1, "Account name is required"),
});

type ConnectAccountForm = z.infer<typeof connectAccountSchema>;

// Dashboard data type
interface DashboardData {
  totalBalance: string;
  dailyPnL: string;
  referralCount: number;
  referralEarnings: string;
  tradingAccounts: any[];
  recentReferralEarnings: any[];
  masterCopierConnections: any[];
  referralLinks: any[];
}

export default function Home() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Dashboard data query
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle dashboard query errors
  useEffect(() => {
    if (dashboardError && isUnauthorizedError(dashboardError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [dashboardError, toast]);

  // Connect account form
  const connectForm = useForm<ConnectAccountForm>({
    resolver: zodResolver(connectAccountSchema),
    defaultValues: {
      broker: 'exness',
      accountId: '',
      accountName: '',
    },
  });

  // Connect account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async (data: ConnectAccountForm) => {
      await apiRequest("POST", "/api/trading-accounts", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trading account connected successfully!",
      });
      setConnectDialogOpen(false);
      connectForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to connect trading account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disconnect account mutation
  const disconnectAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", `/api/trading-accounts/${accountId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trading account disconnected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to disconnect account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Copy referral link
  const copyReferralLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const brokerIcons = {
    exness: { icon: "EX", color: "bg-orange-500", textColor: "text-white" },
    bybit: { icon: "BY", color: "bg-yellow-500", textColor: "text-white" },
    binance: { icon: "BN", color: "bg-yellow-400", textColor: "text-black" }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <ChartLine className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-serif font-bold gradient-text" data-testid="nav-logo">AlvaCapital</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                    data-testid="user-avatar"
                  />
                )}
                <span className="text-sm font-medium" data-testid="user-name">
                  {user.firstName || user.email}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-serif font-bold gradient-text mb-2" data-testid="dashboard-title">
            Welcome Back, {user.firstName || 'Trader'}
          </h1>
          <p className="text-muted-foreground" data-testid="dashboard-subtitle">
            Manage your accounts, track performance, and grow your referral network
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="premium-card" data-testid="stat-total-portfolio">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Wallet className="text-primary h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-green-400">
                  +12.5%
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="total-balance">
                ${dashboardData?.totalBalance || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Total Portfolio</div>
            </CardContent>
          </Card>
          
          <Card className="premium-card" data-testid="stat-daily-pnl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-400 h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-green-400">
                  +5.2%
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1 text-green-400" data-testid="daily-pnl">
                +${dashboardData?.dailyPnL || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Today's P&L</div>
            </CardContent>
          </Card>
          
          <Card className="premium-card" data-testid="stat-referrals">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-400 h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-blue-400">
                  +3 this week
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="referral-count">
                {dashboardData?.referralCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Referrals</div>
            </CardContent>
          </Card>
          
          <Card className="premium-card" data-testid="stat-earnings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-purple-400 h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-purple-400">
                  +$234.50
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="referral-earnings">
                ${dashboardData?.referralEarnings || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Referral Earnings</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Connected Accounts */}
          <div className="lg:col-span-2">
            <Card className="premium-card" data-testid="connected-accounts-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Connected Trading Accounts</CardTitle>
                  <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90" data-testid="connect-account-button">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="connect-account-dialog">
                      <DialogHeader>
                        <DialogTitle>Connect Trading Account</DialogTitle>
                      </DialogHeader>
                      <Form {...connectForm}>
                        <form onSubmit={connectForm.handleSubmit((data) => connectAccountMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={connectForm.control}
                            name="broker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Broker</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="broker-select">
                                      <SelectValue placeholder="Select a broker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="exness">Exness</SelectItem>
                                    <SelectItem value="bybit">Bybit</SelectItem>
                                    <SelectItem value="binance">Binance</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={connectForm.control}
                            name="accountId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your account ID" {...field} data-testid="account-id-input" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={connectForm.control}
                            name="accountName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Give your account a name" {...field} data-testid="account-name-input" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setConnectDialogOpen(false)} data-testid="cancel-connect">
                              Cancel
                            </Button>
                            <Button type="submit" disabled={connectAccountMutation.isPending} data-testid="submit-connect">
                              {connectAccountMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Connect Account
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.tradingAccounts?.length === 0 ? (
                    <div className="text-center py-8" data-testid="no-accounts-message">
                      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No trading accounts connected yet.</p>
                      <p className="text-sm text-muted-foreground">Connect your first account to get started.</p>
                    </div>
                  ) : (
                    dashboardData?.tradingAccounts?.map((account: any) => (
                      <div key={account.id} className="bg-muted/30 rounded-lg p-4 border border-primary/20" data-testid={`account-${account.broker}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${brokerIcons[account.broker as keyof typeof brokerIcons]?.color} rounded-lg flex items-center justify-center`}>
                              <span className={`font-bold ${brokerIcons[account.broker as keyof typeof brokerIcons]?.textColor}`}>
                                {brokerIcons[account.broker as keyof typeof brokerIcons]?.icon}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold">{account.accountName}</div>
                              <div className="text-sm text-muted-foreground">ID: {account.accountId}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-400">Connected</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Balance</div>
                            <div className="font-semibold" data-testid={`balance-${account.broker}`}>
                              ${account.balance}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Today's P&L</div>
                            <div className="font-semibold text-green-400" data-testid={`pnl-${account.broker}`}>
                              +${account.dailyPnL}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Copy Status</div>
                            <div className="font-semibold text-primary" data-testid={`copy-status-${account.broker}`}>
                              {account.copyStatus}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`view-details-${account.broker}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => disconnectAccountMutation.mutate(account.id)}
                            disabled={disconnectAccountMutation.isPending}
                            data-testid={`disconnect-${account.broker}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Links */}
            <Card className="premium-card" data-testid="referral-links-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Referral Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.referralLinks?.map((link: any) => (
                    <div key={link.id} className="bg-muted/30 rounded-lg p-4" data-testid={`referral-link-${link.broker}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{link.broker}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyReferralLink(link.referralUrl)}
                          data-testid={`copy-link-${link.broker}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground break-all">
                        {link.referralUrl}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Master Copier */}
            <Card className="premium-card" data-testid="master-copier-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Master Copier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="text-primary h-8 w-8" />
                  </div>
                  <div className="text-lg font-semibold mb-2">AI Trading Bot</div>
                  <div className="text-sm text-muted-foreground">Automated copy trading system</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-green-500/20 text-green-400" data-testid="copier-status">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected Accounts</span>
                    <span className="font-medium" data-testid="copier-accounts">
                      {dashboardData?.tradingAccounts?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="text-green-400 font-medium" data-testid="copier-performance">+15.2%</span>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" data-testid="manage-copier">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Referral Earnings */}
            <Card className="premium-card" data-testid="referral-earnings-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold gradient-text mb-2" data-testid="monthly-earnings">
                    ${dashboardData?.referralEarnings || '0.00'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total earned this month</div>
                </div>
                <div className="space-y-3">
                  {dashboardData?.recentReferralEarnings?.length === 0 ? (
                    <div className="text-center py-4" data-testid="no-earnings-message">
                      <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No earnings yet</p>
                    </div>
                  ) : (
                    dashboardData?.recentReferralEarnings?.slice(0, 3).map((earning: any, index: number) => (
                      <div key={earning.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg" data-testid={`earning-${index}`}>
                        <div>
                          <div className="font-medium">{earning.broker}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(earning.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-green-400 font-semibold">+${earning.amount}</div>
                      </div>
                    ))
                  )}
                </div>
                {dashboardData?.referralEarnings?.length > 3 && (
                  <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80" data-testid="view-all-earnings">
                    View All Earnings
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
