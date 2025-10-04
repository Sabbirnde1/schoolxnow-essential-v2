import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const schoolRegistrationSchema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolNameBangla: z.string().optional(),
  schoolType: z.enum(["bangla_medium", "english_medium", "madrasha"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  addressBangla: z.string().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  eiinNumber: z.string().optional(),
  establishedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  adminFullName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SchoolRegistrationForm = z.infer<typeof schoolRegistrationSchema>;

const SchoolRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SchoolRegistrationForm>>({
    schoolType: "bangla_medium",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof SchoolRegistrationForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      // Validate form data
      const validatedData = schoolRegistrationSchema.parse(formData);
      setLoading(true);

      // Step 1: Create the school
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: validatedData.schoolName,
          name_bangla: validatedData.schoolNameBangla || null,
          school_type: validatedData.schoolType,
          address: validatedData.address,
          address_bangla: validatedData.addressBangla || null,
          phone: validatedData.phone,
          email: validatedData.email,
          eiin_number: validatedData.eiinNumber || null,
          established_year: validatedData.establishedYear || null,
          is_active: true,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Step 2: Sign up the admin user with school_id in metadata
      const { error: signUpError } = await supabase.auth.signUp({
        email: validatedData.adminEmail,
        password: validatedData.adminPassword,
        options: {
          data: {
            full_name: validatedData.adminFullName,
            role: "school_admin",
            school_id: schoolData.id,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        // If user signup fails, we should ideally delete the school
        // But for now, we'll just show the error
        throw signUpError;
      }

      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account. Once verified and approved by our team, you can start using the system.",
      });

      // Redirect to auth page
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message || "An error occurred during registration. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 sm:mb-6 h-11 px-4 text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to Home</span>
        </Button>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl sm:rounded-2xl blur-md sm:blur-lg group-hover:blur-xl transition-all duration-300" />
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-primary/30 group-hover:border-primary/50 transition-all duration-300 shadow-elegant group-hover:scale-105">
              <img src={logo} alt="SchoolXNow Logo" className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-xl" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-center sm:text-left">
            Register Your School
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* School Information Card */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">School Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Enter your school's basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="text-sm">School Name (English) *</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName || ""}
                    onChange={(e) => handleInputChange("schoolName", e.target.value)}
                    placeholder="Enter school name"
                    className="h-11 text-base"
                  />
                  {errors.schoolName && <p className="text-xs sm:text-sm text-destructive">{errors.schoolName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolNameBangla" className="text-sm">School Name (Bangla)</Label>
                  <Input
                    id="schoolNameBangla"
                    value={formData.schoolNameBangla || ""}
                    onChange={(e) => handleInputChange("schoolNameBangla", e.target.value)}
                    placeholder="স্কুলের নাম"
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType" className="text-sm">School Type *</Label>
                  <Select
                    value={formData.schoolType}
                    onValueChange={(value) => handleInputChange("schoolType", value)}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bangla_medium">Bangla Medium</SelectItem>
                      <SelectItem value="english_medium">English Medium</SelectItem>
                      <SelectItem value="madrasha">Madrasha</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.schoolType && <p className="text-xs sm:text-sm text-destructive">{errors.schoolType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">Address (English) *</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter school address"
                    className="h-11 text-base"
                  />
                  {errors.address && <p className="text-xs sm:text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressBangla" className="text-sm">Address (Bangla)</Label>
                  <Input
                    id="addressBangla"
                    value={formData.addressBangla || ""}
                    onChange={(e) => handleInputChange("addressBangla", e.target.value)}
                    placeholder="স্কুলের ঠিকানা"
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">School Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+880..."
                    className="h-11 text-base"
                  />
                  {errors.phone && <p className="text-xs sm:text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">School Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="school@example.com"
                    className="h-11 text-base"
                  />
                  {errors.email && <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eiinNumber" className="text-sm">EIIN Number</Label>
                  <Input
                    id="eiinNumber"
                    value={formData.eiinNumber || ""}
                    onChange={(e) => handleInputChange("eiinNumber", e.target.value)}
                    placeholder="Educational Institution ID"
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear" className="text-sm">Established Year</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={formData.establishedYear || ""}
                    onChange={(e) => handleInputChange("establishedYear", parseInt(e.target.value))}
                    placeholder="1990"
                    className="h-11 text-base"
                  />
                  {errors.establishedYear && <p className="text-xs sm:text-sm text-destructive">{errors.establishedYear}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Admin Information Card */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Administrator Account</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Set up your admin account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="adminFullName" className="text-sm">Full Name *</Label>
                  <Input
                    id="adminFullName"
                    value={formData.adminFullName || ""}
                    onChange={(e) => handleInputChange("adminFullName", e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11 text-base"
                  />
                  {errors.adminFullName && <p className="text-xs sm:text-sm text-destructive">{errors.adminFullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-sm">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail || ""}
                    onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                    placeholder="admin@example.com"
                    className="h-11 text-base"
                  />
                  {errors.adminEmail && <p className="text-xs sm:text-sm text-destructive">{errors.adminEmail}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone" className="text-sm">Phone Number *</Label>
                  <Input
                    id="adminPhone"
                    value={formData.adminPhone || ""}
                    onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                    placeholder="+880..."
                    className="h-11 text-base"
                  />
                  {errors.adminPhone && <p className="text-xs sm:text-sm text-destructive">{errors.adminPhone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="text-sm">Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword || ""}
                    onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                    placeholder="Min. 6 characters"
                    className="h-11 text-base"
                  />
                  {errors.adminPassword && <p className="text-xs sm:text-sm text-destructive">{errors.adminPassword}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword || ""}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                    className="h-11 text-base"
                  />
                  {errors.confirmPassword && <p className="text-xs sm:text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <div className="pt-2 sm:pt-4 space-y-3 sm:space-y-4">
                  <div className="bg-muted p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">What happens next?</h4>
                    <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                      <li>• Your school will be registered in our system</li>
                      <li>• You'll receive a verification email</li>
                      <li>• Our team will review and approve your registration</li>
                      <li>• Once approved, you can start using all features</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? "Registering..." : "Register School"}
                  </Button>

                  <p className="text-xs sm:text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs sm:text-sm"
                      onClick={() => navigate("/auth")}
                      type="button"
                    >
                      Sign in here
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistration;