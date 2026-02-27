"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createLocation, toggleFavorite, archiveLocation } from "./actions";
import { LOCATION_TYPES } from "@/lib/constants";
import { MapPin, Star, StarOff, Archive, Plus, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/types/database";

interface LocationsListProps {
  locations: Location[];
}

export function LocationsList({ locations }: LocationsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeLocations = locations.filter((l) => !l.is_archived);
  const archivedLocations = locations.filter((l) => l.is_archived);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await createLocation({
      name: form.get("name"),
      type: form.get("type"),
      city: form.get("city") || null,
      country: form.get("country") || null,
      address: form.get("address") || null,
      platform_url: form.get("platform_url") || null,
    });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Lieu créé");
      setShowForm(false);
    }
    setLoading(false);
  }

  async function handleToggleFavorite(id: string, current: boolean) {
    const result = await toggleFavorite(id, !current);
    if (result?.error) toast.error(result.error);
  }

  async function handleArchive(id: string) {
    if (confirm("Archiver ce lieu ?")) {
      const result = await archiveLocation(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Lieu archivé");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
          <Plus className="h-4 w-4" /> Ajouter un lieu
        </Button>
      ) : (
        <Card>
          <CardHeader><CardTitle>Nouveau lieu</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input name="name" required placeholder="Casino Barrière" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="type" required>
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt.value} value={lt.value}>{lt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input name="city" placeholder="Toulouse" />
                </div>
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input name="country" placeholder="France" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input name="address" placeholder="123 rue..." />
              </div>
              <div className="space-y-2">
                <Label>URL plateforme (online)</Label>
                <Input name="platform_url" type="url" placeholder="https://..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={loading}>Créer</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Locations grid */}
      {activeLocations.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun lieu</h3>
            <p className="text-muted-foreground text-center">Ajoutez vos casinos, clubs et salles en ligne.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeLocations.map((loc) => (
            <Card key={loc.id} className="relative">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {loc.type === "online" ? (
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {LOCATION_TYPES.find((t) => t.value === loc.type)?.label}
                        </Badge>
                        {loc.city && <span className="text-xs text-muted-foreground">{loc.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleFavorite(loc.id, loc.is_favorite)}
                    >
                      {loc.is_favorite ? (
                        <Star className="h-4 w-4 text-warning fill-warning" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleArchive(loc.id)}
                    >
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Archived */}
      {archivedLocations.length > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Masquer" : "Voir"} les lieux archivés ({archivedLocations.length})
          </Button>
          {showArchived && (
            <div className="grid gap-3 sm:grid-cols-2 mt-3 opacity-50">
              {archivedLocations.map((loc) => (
                <Card key={loc.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{loc.name}</p>
                        <Badge variant="outline" className="text-xs">Archivé</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
