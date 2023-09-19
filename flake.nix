{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.flake-compat.url = "github:edolstra/flake-compat";
  inputs.flake-compat.flake = false;
  outputs = {
    self,
    nixpkgs,
    flake-utils,
    flake-compat,
  } @ inputs: let
    inherit (nixpkgs) lib;
    inherit (lib) recursiveUpdate;
    inherit (flake-utils.lib) eachDefaultSystem defaultSystems;
    nixpkgsFor = lib.genAttrs defaultSystems (system:
      import nixpkgs {
        config = {
          allowUnfree = true;
        };
        inherit system;
      });
  in (eachDefaultSystem (
    system: let
      pkgs = nixpkgsFor.${system};
    in {
      devShell = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          bashInteractive
        ];
        buildInputs = with pkgs; [
          # Watch for changes
          inotify-tools

          # Node
          nodejs_20
          nodejs_20.pkgs.eslint
          nodejs_20.pkgs.pnpm
          nodejs_20.pkgs.typescript
        ];
      };
    }
  ));
}
