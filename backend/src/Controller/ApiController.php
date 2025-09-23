<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api', name: 'api')]
final class ApiController extends AbstractController
{
    #[Route('/ping', name: 'ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return new JsonResponse(['pong' => true]);
    }

    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        // Todo: Check db connection etc. later
        return new JsonResponse([
            'status' => 'healthy',
            'checks' => [
                'database' => 'ok',
                'jwt' => 'ok'
            ]
        ]);
    }
}
