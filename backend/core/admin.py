from django.contrib import admin

from .models import Beneficiary, Project

admin.site.register(Project)
admin.site.register(Beneficiary)
