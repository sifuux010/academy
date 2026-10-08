from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm

from .forms import UserChangeForm, UserCreationForm
from .models import PhysiotherapistProfile, StudentProfile, User, UserSettings


class PhysiotherapistProfileInline(admin.StackedInline):
    model = PhysiotherapistProfile
    extra = 0
    can_delete = False


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    extra = 0
    can_delete = False


class UserSettingsInline(admin.StackedInline):
    model = UserSettings
    extra = 0
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    change_password_form = AdminPasswordChangeForm
    model = User

    list_display = ("email", "full_name", "role", "profile_type", "status",
                    "premium", "country", "created_at")
    list_filter = ("role", "status", "profile_type", "premium", "email_verified", "locale")
    search_fields = ("email", "first_name", "last_name", "city", "country")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "last_login", "last_login_at")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name", "phone", "country", "city",
                                 "avatar_url", "bio")}),
        ("Compte", {"fields": ("profile_type", "role", "status", "email_verified",
                               "locale", "premium", "newsletter")}),
        ("Droits Django", {"fields": ("is_staff", "is_superuser", "groups",
                                      "user_permissions"),
                           "classes": ("collapse",)}),
        ("Horodatage", {"fields": ("created_at", "updated_at", "last_login",
                                   "last_login_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "profile_type", "role",
                       "password1", "password2"),
        }),
    )
    inlines = [PhysiotherapistProfileInline, StudentProfileInline, UserSettingsInline]

    @admin.display(description="nom")
    def full_name(self, obj):
        return obj.full_name
